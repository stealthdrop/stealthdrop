pragma circom 2.0.2;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/multiplexer.circom";

include "bigint.circom";
include "secp256k1.circom";
include "bigint_func.circom";
include "ecdsa_func.circom";
include "secp256k1_func.circom";

// keys are encoded as (x, y) pairs with each coordinate being
// encoded with k registers of n bits each
template ECDSAPrivToPub(n, k) {
    var stride = 10;
    signal input privkey[k];
    signal output pubkey[2][k];

    component n2b[k];
    for (var i = 0; i < k; i++) {
        n2b[i] = Num2Bits(n);
        n2b[i].in <== privkey[i];
    }

    var num_strides = 258 \ stride;
    if (258 % stride > 0) {
        num_strides = num_strides + 1;
    }
    // power[i][j] contains: [j * (1 << stride * i) * G] for 1 <= j < (1 << stride)
    var powers[258][1024][2][3];
    powers = get_g_pow_stride10_table(86, 3, 258);

    // contains a dummy point to stand in when we are adding 0
    var dummy[2][3];
    // dummy = (2 ** 258) * G
    dummy[0][0] = 35872591715049374896265832;
    dummy[0][1] = 6356226619579407084632810;
    dummy[0][2] = 2978520823699096284322372;
    dummy[1][0] = 26608736705833900595211029;
    dummy[1][1] = 58274658945430015619912323;
    dummy[1][2] = 4380191706425255173800171;

    // selector[i] contains a value in [0, ..., 2**i - 1]
    component selectors[num_strides];
    for (var i = 0; i < num_strides; i++) {
        selectors[i] = Bits2Num(stride);
        for (var j = 0; j < stride; j++) {
            var bit_idx1 = (i * stride + j) \ n;
            var bit_idx2 = (i * stride + j) % n;
            if (bit_idx1 < k) {
                selectors[i].in[j] <== n2b[bit_idx1].out[bit_idx2];
            } else {
                selectors[i].in[j] <== 0;
            }
        }
    }

    // multiplexers[i][l].out will be the coordinates of:
    // selectors[i].out * (2 ** (i * stride)) * G    if selectors[i].out is non-zero
    // (2 ** 258) * G                                if selectors[i].out is zero
    component multiplexers[num_strides][2];
    // select from k-register outputs using a 2 ** stride bit selector
    for (var i = 0; i < num_strides; i++) {
        for (var l = 0; l < 2; l++) {
            multiplexers[i][l] = Multiplexer(k, (1 << stride));
            multiplexers[i][l].sel <== selectors[i].out;
            for (var idx = 0; idx < k; idx++) {
                multiplexers[i][l].inp[0][idx] <== dummy[l][idx];
                for (var j = 1; j < (1 << stride); j++) {
                    multiplexers[i][l].inp[j][idx] <== powers[i][j][l][idx];
                }
            }
        }
    }

    component iszero[num_strides];
    for (var i = 0; i < num_strides; i++) {
        iszero[i] = IsZero();
        iszero[i].in <== selectors[i].out;
    }

    // has_prev_nonzero[i] = 1 if at least one of the selections in privkey up to stride i is non-zero
    component has_prev_nonzero[num_strides];
    has_prev_nonzero[0] = OR();
    has_prev_nonzero[0].a <== 0;
    has_prev_nonzero[0].b <== 1 - iszero[0].out;
    for (var i = 1; i < num_strides; i++) {
        has_prev_nonzero[i] = OR();
        has_prev_nonzero[i].a <== has_prev_nonzero[i - 1].out;
        has_prev_nonzero[i].b <== 1 - iszero[i].out;
    }

    signal partial[num_strides][2][k];
    for (var idx = 0; idx < k; idx++) {
        for (var l = 0; l < 2; l++) {
            partial[0][l][idx] <== multiplexers[0][l].out[idx];
        }
    }

    component adders[num_strides - 1];
    signal intermed1[num_strides - 1][2][k];
    signal intermed2[num_strides - 1][2][k];
    for (var i = 1; i < num_strides; i++) {
        adders[i - 1] = Secp256k1AddUnequal(n, k);
        for (var idx = 0; idx < k; idx++) {
            for (var l = 0; l < 2; l++) {
                adders[i - 1].a[l][idx] <== partial[i - 1][l][idx];
                adders[i - 1].b[l][idx] <== multiplexers[i][l].out[idx];
            }
        }

        // partial[i] = has_prev_nonzero[i - 1] * ((1 - iszero[i]) * adders[i - 1].out + iszero[i] * partial[i - 1][0][idx])
        //              + (1 - has_prev_nonzero[i - 1]) * (1 - iszero[i]) * multiplexers[i]
        for (var idx = 0; idx < k; idx++) {
            for (var l = 0; l < 2; l++) {
                intermed1[i - 1][l][idx] <== iszero[i].out * (partial[i - 1][l][idx] - adders[i - 1].out[l][idx]) + adders[i - 1].out[l][idx];
                intermed2[i - 1][l][idx] <== multiplexers[i][l].out[idx] - iszero[i].out * multiplexers[i][l].out[idx];
                partial[i][l][idx] <== has_prev_nonzero[i - 1].out * (intermed1[i - 1][l][idx] - intermed2[i - 1][l][idx]) + intermed2[i - 1][l][idx];
            }
        }
    }

    for (var i = 0; i < k; i++) {
        for (var l = 0; l < 2; l++) {
            pubkey[l][i] <== partial[num_strides - 1][l][i];
        }
    }
}

/*
// r, s, msghash, nonce, and privkey have coordinates
// encoded with k registers of n bits each
// signature is (r, s)
template ECDSASign(n, k) {
    signal input privkey[k];
    signal input msghash[k];
    signal input nonce[k];
    signal output r[k];
    signal output s[k];

    // compute (x1, y1) = nonce * G
    // TODO(tony): use stride version; rename this? same operation though
    component nonceMult = ECDSAPrivToPub(n, k);
    for (var i = 0; i < k; i++) {
        nonceMult.privkey[i] <== nonce[i];
    }
    signal p1[k][2];
    for (var i = 0; i < k; i++) {
        p1[i][0] <== nonceMult.pubkey[i][0];
        p1[i][1] <== nonceMult.pubkey[i][1];
    }

    // compute r = x1 % N
    // assume that r != 0 for now
    // need to be big enough to fit the order
    assert(n * k >= 256);
    // TODO(tony): rewrite in a way that works...
    signal nVal[k];
    var nConst = 115792089237316195423570985008687907852837564279074904382605163141518161494337;
    for (var i = 0; i < k; i++) {
        var chunk = (nConst >> i) & ((1 << k) - 1);
        nVal[i] <== chunk;
    }
    component rMod = BigMod(n, k);
    for (var i = 0; i < k; i++) {
        rMod.a[i] <== p1[i][0];
        rMod.b[i] <== nVal[i];
    }
    for (var i = 0; i < k; i++) {
        r[i] <== rMod.out[i];
    }

    // get the 256 left-most bits of msghash
    // need to be big enough to fit hash value
    assert(n * k >= 256);
    signal z[k];
    for (var i = 0; i < k; i++) {
        if (i * n < 256) {
            z[i] <== msghash[i];
        }
        else {
            z[i] <== 0;
        }
    }

    // compute s = nonce^{-1} (z + r * privkey) % N
    // assume that s != 0 for now
    component rMul = BigMultModP(n, k);
    for (var i = 0; i < k; i++) {
        rMul.a[i] <== r[i];
        rMul.b[i] <== privkey[i];
        rMul.p[i] <== nVal[i];
    }
    component zAdd = BigAdd(n, k);
    for (var i = 0; i < k; i++) {
        zAdd.a[i] <== rMul.out[i];
        zAdd.b[i] <== z[i];
    }
    component sMod = BigMod(n, k);
    for (var i = 0; i < k; i++) {
        sMod.a[i] <== zAdd.out[i];
        sMod.b[i] <== nVal[i];
    }
    component nInv = BigModInv(n, k);
    for (var i = 0; i < k; i++) {
        nInv.a[i] <== nonce[i];
        nInv.b[i] <== nVal[i];
    }
    signal nonceInv[k];
    for (var i = 0; i < k; i++) {
        nonceInv[i] <== nInv.out[i];
    }
    component sMul = BigMultModP(n, k);
    for (var i = 0; i < k; i++) {
        sMul.a[i] <== sMod.out[i];
        sMul.b[i] <== nonceInv[i];
        sMul.p[i] <== nVal[i];
    }

    for (var i = 0; i < k; i++) {
        s[i] <== sMul.out[i];
    }
}
*/

// r, s, msghash, nonce, and privkey have coordinates
// encoded with k registers of n bits each
// v is a bit
// signature is (r, s, v)
template ECDSAExtendedSign(n, k) {
    signal input privkey[k];
    signal input msghash[k];
    signal input nonce[k];

    signal output r[k];
    signal output s[k];
    signal output v;
}

// r, s, msghash, and pubkey have coordinates
// encoded with k registers of n bits each
// signature is (r, s)
template ECDSAVerify(n, k) {
    assert(k >= 2);
    assert(k <= 100);

    signal input r[k];
    signal input s[k];
    signal input msghash[k];
    signal input pubkey[2][k];

    signal output result;

    var p[100] = get_secp256k1_prime(n, k);
    var order[100] = get_secp256k1_order(n, k);

    var sinv_comp[100] = mod_inv(n, k, s, order);
    signal sinv[k];
    component sinv_range_checks[k];
    for (var idx = 0; idx < k; idx++) {
        sinv[idx] <-- sinv_comp[idx];
        sinv_range_checks[idx] = Num2Bits(n);
        sinv_range_checks[idx].in <== sinv[idx];
    }
    component sinv_check = BigMultModP(n, k);
    for (var idx = 0; idx < k; idx++) {
        sinv_check.a[idx] <== sinv[idx];
        sinv_check.b[idx] <== s[idx];
        sinv_check.p[idx] <== order[idx];
    }
    for (var idx = 0; idx < k; idx++) {    
        if (idx > 0) {
            sinv_check.out[idx] === 0;
        }
        if (idx == 0) {
            sinv_check.out[idx] === 1;
        }
    }

    // compute (h * sinv) mod n
    component g_coeff = BigMultModP(n, k);
    for (var idx = 0; idx < k; idx++) {
        g_coeff.a[idx] <== sinv[idx];
        g_coeff.b[idx] <== msghash[idx];
        g_coeff.p[idx] <== order[idx];
    }

    // compute (h * sinv) * G
    component g_mult = ECDSAPrivToPub(n, k);
    for (var idx = 0; idx < k; idx++) {
        g_mult.privkey[idx] <== g_coeff.out[idx];
    }

    // compute (r * sinv) mod n
    component pubkey_coeff = BigMultModP(n, k);
    for (var idx = 0; idx < k; idx++) {
        pubkey_coeff.a[idx] <== sinv[idx];
        pubkey_coeff.b[idx] <== r[idx];
        pubkey_coeff.p[idx] <== order[idx];
    }

    // compute (r * sinv) * pubkey
    component pubkey_mult = Secp256k1ScalarMult(n, k);
    for (var idx = 0; idx < k; idx++) {
        pubkey_mult.scalar[idx] <== pubkey_coeff.out[idx];
        pubkey_mult.point[0][idx] <== pubkey[0][idx];
        pubkey_mult.point[1][idx] <== pubkey[1][idx];
    }

    // compute (h * sinv) * G + (r * sinv) * pubkey
    component sum_res = Secp256k1AddUnequal(n, k);
    for (var idx = 0; idx < k; idx++) {
        sum_res.a[0][idx] <== g_mult.pubkey[0][idx];
        sum_res.a[1][idx] <== g_mult.pubkey[1][idx];
        sum_res.b[0][idx] <== pubkey_mult.out[0][idx];
        sum_res.b[1][idx] <== pubkey_mult.out[1][idx];
    }

    // compare sum_res.x with r
    component compare[k];
    signal num_equal[k - 1];
    for (var idx = 0; idx < k; idx++) {
        compare[idx] = IsEqual();
        compare[idx].in[0] <== r[idx];
        compare[idx].in[1] <== sum_res.out[0][idx];

        if (idx > 0) {
            if (idx == 1) {
                num_equal[idx - 1] <== compare[0].out + compare[1].out;
            } else {
                num_equal[idx - 1] <== num_equal[idx - 2] + compare[idx].out;
            }
        }
    }
    component res_comp = IsEqual();
    res_comp.in[0] <== k;
    res_comp.in[1] <== num_equal[k - 2];
    result <== res_comp.out;
}

// r, s, and msghash have coordinates
// encoded with k registers of n bits each
// v is a single bit
// extended signature is (r, s, v)
template ECDSAExtendedVerify(n, k) {
    signal input r[k];
    signal input s[k];
    signal input v;
    signal input msghash[k];

    signal output result;
}
