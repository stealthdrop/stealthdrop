pragma circom 2.0.2;

include "../../node_modules/circomlib/circuits/bitify.circom";

include "bigint.circom";
include "bigint_func.circom";
include "secp256k1_func.circom";

// requires a[0] != b[0]
//
// Implements:
// lamb = (b[1] - a[1]) / (b[0] - a[0]) % p
// out[0] = lamb ** 2 - a[0] - b[0] % p
// out[1] = lamb * (a[0] - out[0]) - a[1] % p
template Secp256k1AddUnequal(n, k) {
    signal input a[2][k];
    signal input b[2][k];

    signal output out[2][k];

    var p[100] = get_secp256k1_prime(n, k);

    // b[1] - a[1]
    component sub1 = BigSubModP(n, k);
    for (var i = 0; i < k; i++) {
        sub1.a[i] <== b[1][i];
        sub1.b[i] <== a[1][i];
        sub1.p[i] <== p[i];
    }

    // b[0] - a[0]
    component sub0 = BigSubModP(n, k);
    for (var i = 0; i < k; i++) {
        sub0.a[i] <== b[0][i];
        sub0.b[i] <== a[0][i];
        sub0.p[i] <== p[i];
    }

    signal lambda[k];
    var sub0inv[100] = mod_inv(n, k, sub0.out, p);
    var sub1_sub0inv[100] = prod(n, k, sub1.out, sub0inv);
    var lamb_arr[2][100] = long_div(n, k, sub1_sub0inv, p);
    for (var i = 0; i < k; i++) {
        lambda[i] <-- lamb_arr[1][i];
    }
    component range_checks[k];
    for (var i = 0; i < k; i++) {
        range_checks[i] = Num2Bits(n);
        range_checks[i].in <== lambda[i];
    }
    component lt = BigLessThan(n, k);
    for (var i = 0; i < k; i++) {
        lt.a[i] <== lambda[i];
        lt.b[i] <== p[i];
    }
    lt.out === 1;

    component lambda_check = BigMultModP(n, k);
    for (var i = 0; i < k; i++) {
        lambda_check.a[i] <== sub0.out[i];
        lambda_check.b[i] <== lambda[i];
        lambda_check.p[i] <== p[i];
    }
    for (var i = 0; i < k; i++) {
        lambda_check.out[i] === sub1.out[i];
    }

    component lambdasq = BigMultModP(n, k);
    for (var i = 0; i < k; i++) {
        lambdasq.a[i] <== lambda[i];
        lambdasq.b[i] <== lambda[i];
        lambdasq.p[i] <== p[i];
    }
    component out0_pre = BigSubModP(n, k);
    for (var i = 0; i < k; i++) {
        out0_pre.a[i] <== lambdasq.out[i];
        out0_pre.b[i] <== a[0][i];
        out0_pre.p[i] <== p[i];
    }
    component out0 = BigSubModP(n, k);
    for (var i = 0; i < k; i++) {
        out0.a[i] <== out0_pre.out[i];
        out0.b[i] <== b[0][i];
        out0.p[i] <== p[i];
    }
    for (var i = 0; i < k; i++) {
        out[0][i] <== out0.out[i];
    }

    component out1_0 = BigSubModP(n, k);
    for (var i = 0; i < k; i++) {
        out1_0.a[i] <== a[0][i];
        out1_0.b[i] <== out[0][i];
        out1_0.p[i] <== p[i];
    }
    component out1_1 = BigMultModP(n, k);
    for (var i = 0; i < k; i++) {
        out1_1.a[i] <== lambda[i];
        out1_1.b[i] <== out1_0.out[i];
        out1_1.p[i] <== p[i];
    }
    component out1 = BigSubModP(n, k);
    for (var i = 0; i < k; i++) {
        out1.a[i] <== out1_1.out[i];
        out1.b[i] <== a[1][i];
        out1.p[i] <== p[i];
    }
    for (var i = 0; i < k; i++) {
        out[1][i] <== out1.out[i];
    }
}

// Implements:
// lamb = (3 / 2) * in[0] ** 2 / in[1] % p
// out[0] = lamb ** 2 - 2 * a[0] % p
// out[1] = lamb * (in[0] - out[0]) - in[1] % p
template Secp256k1Double(n, k) {
    signal input in[2][k];

    signal output out[2][k];

    var p[100] = get_secp256k1_prime(n, k);

    component in0_sq = BigMultModP(n, k);
    for (var i = 0; i < k; i++) {    
        in0_sq.a[i] <== in[0][i];
        in0_sq.b[i] <== in[0][i];
	in0_sq.p[i] <== p[i];
    }

    var long_2[100];
    var long_3[100];    
    long_2[0] = 2;
    long_3[0] = 3;    
    for (var i = 1; i < k; i++) {
        long_2[i] = 0;
        long_3[i] = 0;	
    }
    var inv_2[100] = mod_inv(n, k, long_2, p);
    var long_3_div_2[100] = prod(n, k, long_3, inv_2);
    var long_3_div_2_mod_p[2][100] = long_div(n, k, long_3_div_2, p);
    
    component numer = BigMultModP(n, k);
    for (var i = 0; i < k; i++) {
        numer.a[i] <== long_3_div_2_mod_p[1][i];
        numer.b[i] <== in0_sq.out[i];
	numer.p[i] <== p[i];
    }

    signal lambda[k];
    var denom_inv[100] = mod_inv(n, k, in[1], p);
    var product[100] = prod(n, k, numer.out, denom_inv);
    var lamb_arr[2][100] = long_div(n, k, product, p);
    for (var i = 0; i < k; i++) {
        lambda[i] <-- lamb_arr[1][i];
    }
    component lt = BigLessThan(n, k);
    for (var i = 0; i < k; i++) {
        lt.a[i] <== lambda[i];
        lt.b[i] <== p[i];
    }
    lt.out === 1;

    component lambda_range_checks[k];
    component lambda_check = BigMultModP(n, k);
    for (var i = 0; i < k; i++) {
        lambda_range_checks[i] = Num2Bits(n);
	lambda_range_checks[i].in <== lambda[i];
	
        lambda_check.a[i] <== in[1][i];
        lambda_check.b[i] <== lambda[i];
        lambda_check.p[i] <== p[i];
    }
    for (var i = 0; i < k; i++) {
        lambda_check.out[i] === numer.out[i];
    }

    component lambdasq = BigMultModP(n, k);
    for (var i = 0; i < k; i++) {
        lambdasq.a[i] <== lambda[i];
        lambdasq.b[i] <== lambda[i];
        lambdasq.p[i] <== p[i];
    }
    component out0_pre = BigSubModP(n, k);
    for (var i = 0; i < k; i++) {
        out0_pre.a[i] <== lambdasq.out[i];
        out0_pre.b[i] <== in[0][i];
        out0_pre.p[i] <== p[i];
    }
    component out0 = BigSubModP(n, k);
    for (var i = 0; i < k; i++) {
        out0.a[i] <== out0_pre.out[i];
        out0.b[i] <== in[0][i];
        out0.p[i] <== p[i];
    }
    for (var i = 0; i < k; i++) {
        out[0][i] <== out0.out[i];
    }

    component out1_0 = BigSubModP(n, k);
    for (var i = 0; i < k; i++) {
        out1_0.a[i] <== in[0][i];
        out1_0.b[i] <== out[0][i];
        out1_0.p[i] <== p[i];
    }
    component out1_1 = BigMultModP(n, k);
    for (var i = 0; i < k; i++) {
        out1_1.a[i] <== lambda[i];
        out1_1.b[i] <== out1_0.out[i];
        out1_1.p[i] <== p[i];
    }
    component out1 = BigSubModP(n, k);
    for (var i = 0; i < k; i++) {
        out1.a[i] <== out1_1.out[i];
        out1.b[i] <== in[1][i];
        out1.p[i] <== p[i];
    }
    for (var i = 0; i < k; i++) {
        out[1][i] <== out1.out[i];
    }
}

template Secp256k1ScalarMult(n, k) {
    signal input scalar[k];
    signal input point[2][k];

    signal output out[2][k];

    component n2b[k];
    for (var i = 0; i < k; i++) {
        n2b[i] = Num2Bits(n);
        n2b[i].in <== scalar[i];
    }

    // has_prev_non_zero[n * i + j] == 1 if there is a nonzero bit in location [i][j] or higher order bit
    component has_prev_non_zero[k * n];
    for (var i = k - 1; i >= 0; i--) {
        for (var j = n - 1; j >= 0; j--) {
	    has_prev_non_zero[n * i + j] = OR();
	    if (i == k - 1 && j == n - 1) {
	        has_prev_non_zero[n * i + j].a <== 0;
		has_prev_non_zero[n * i + j].b <== n2b[i].out[j];
            } else {
	        has_prev_non_zero[n * i + j].a <== has_prev_non_zero[n * i + j + 1].out;
		has_prev_non_zero[n * i + j].b <== n2b[i].out[j];
            }
	}
    }

    signal partial[n * k][2][k];
    signal intermed[n * k - 1][2][k];
    component adders[n * k - 1];
    component doublers[n * k - 1];
    for (var i = k - 1; i >= 0; i--) {
        for (var j = n - 1; j >= 0; j--) {
	    if (i == k - 1 && j == n - 1) {
	        for (var idx = 0; idx < k; idx++) {
                    partial[n * i + j][0][idx] <== point[0][idx];
                    partial[n * i + j][1][idx] <== point[1][idx];
		}
	    }
	    if (i < k - 1 || j < n - 1) {
                adders[n * i + j] = Secp256k1AddUnequal(n, k);
                doublers[n * i + j] = Secp256k1Double(n, k);
		for (var idx = 0; idx < k; idx++) {
		    doublers[n * i + j].in[0][idx] <== partial[n * i + j + 1][0][idx];
		    doublers[n * i + j].in[1][idx] <== partial[n * i + j + 1][1][idx];
		}
		for (var idx = 0; idx < k; idx++) {
		    adders[n * i + j].a[0][idx] <== doublers[n * i + j].out[0][idx];
		    adders[n * i + j].a[1][idx] <== doublers[n * i + j].out[1][idx];
		    adders[n * i + j].b[0][idx] <== point[0][idx];
		    adders[n * i + j].b[1][idx] <== point[1][idx];
		}
                // partial[n * i + j]
		// = has_prev_non_zero[n * i + j + 1] * ((1 - n2b[i].out[j]) * doublers[n * i + j] + n2b[i].out[j] * adders[n * i + j])
		//   + (1 - has_prev_non_zero[n * i + j + 1]) * point
		for (var idx = 0; idx < k; idx++) {
		    intermed[n * i + j][0][idx] <== n2b[i].out[j] * (adders[n * i + j].out[0][idx] - doublers[n * i + j].out[0][idx]) + doublers[n * i + j].out[0][idx];
		    intermed[n * i + j][1][idx] <== n2b[i].out[j] * (adders[n * i + j].out[1][idx] - doublers[n * i + j].out[1][idx]) + doublers[n * i + j].out[1][idx];
		    partial[n * i + j][0][idx] <== has_prev_non_zero[n * i + j + 1].out * (intermed[n * i + j][0][idx] - point[0][idx]) + point[0][idx];
		    partial[n * i + j][1][idx] <== has_prev_non_zero[n * i + j + 1].out * (intermed[n * i + j][1][idx] - point[1][idx]) + point[1][idx];
		}
            }
	}
    }

    for (var idx = 0; idx < k; idx++) {
        out[0][idx] <== partial[0][0][idx];
        out[1][idx] <== partial[0][1][idx];
    }
}

