import math

P = 2**256 - 2**32 - 977
N = 115792089237316195423570985008687907852837564279074904382605163141518161494337
A = 0
B = 7
Gx = 55066263022277343669578718895168534326250603453777594175500187360389116729240
Gy = 32670510020758816978083085130507043184471273380659243275938904335757337482424

def egcd(a, b):
    if a == 0:
        return (b, 0, 1)
    else:
        g, y, x = egcd(b % a, a)
        return (g, x - (b // a) * y, y)

def modinv(a, m):
    g, x, y = egcd(a, m)
    if g != 1:
        raise Exception('modular inverse does not exist')
    else:
        return x % m

def double(x, y):
    lamb = (3 * (x ** 2) * modinv(2 * y, P)) % P
    retx = (lamb ** 2 - 2 * x) % P
    rety = (lamb * (x - retx) - y) % P
    return retx, rety

def add(x1, y1, x2, y2):
    lamb = ((y2 - y1) * modinv(P + x2 - x1, P)) % P
    retx = (P + lamb ** 2 - x1 - x2) % P
    rety = (P + lamb * (x1 - retx) - y1) % P
    return retx, rety

def get_g_pows(exp):
    g_pows = []
    curr_x, curr_y = Gx, Gy
    for idx in range(exp):
        g_pows.append((curr_x, curr_y))
        curr_x, curr_y = double(curr_x, curr_y)
    return g_pows

def get_long(n, k, x):
    ret = []
    for idx in range(k):
        ret.append(x % (2 ** n))
        x = x // (2 ** n)
    return ret

def get_long_g_pows(exp, n, k):
    g_pows = get_g_pows(exp)
    long_g_pows = []
    for x, y in g_pows:
        long_x, long_y = get_long(n, k, x), get_long(n, k, y)
        long_g_pows.append((long_x, long_y))
    return long_g_pows

def get_binary(x):
    ret = []
    while x > 0:
        ret.append(x % 2)
        x = x // 2
    return ret

def get_g_pow_val(g_pows, exp, n, k):
    binary = get_binary(exp)
    is_nonzero = False
    curr_sum = None
    for idx, val in enumerate(binary):
        if val != 0:
            if not is_nonzero:
                is_nonzero = True 
                curr_sum = g_pows[idx]
            else:
                curr_sum = add(curr_sum[0], curr_sum[1], g_pows[idx][0], g_pows[idx][1])
    return curr_sum            
            
def get_cache_str(n, k, stride):
    num_strides = math.ceil(n * k / stride);
    stride_cache_size = 2 ** stride
    ret_str = '''
function get_g_pow_stride{}_table(n, k, exp) '''.format(stride)
    ret_str = ret_str + '{'
    ret_str = ret_str + '''
    assert(n == 86 && k == 3);
    assert(exp >= 1 && exp <= 264);
    var powers[{}][{}][2][3];
'''.format(258, 1024);
    EXP = 264
    g_pows = get_g_pows(EXP)

    for stride_idx in range(num_strides):
        for idx in range(2 ** stride):
            exp = idx * (2 ** (stride_idx * stride))
            if exp > 0:
                g_pow = get_g_pow_val(g_pows, exp, n, k)
                long_g_pow = get_long(n, k, g_pow[0]), get_long(n, k, g_pow[1])
                ret_append = '''
    powers[{}][{}][0][0] = {};
    powers[{}][{}][0][1] = {};
    powers[{}][{}][0][2] = {};
    powers[{}][{}][1][0] = {};
    powers[{}][{}][1][1] = {};
    powers[{}][{}][1][2] = {};
'''.format(stride_idx, idx, long_g_pow[0][0],
           stride_idx, idx, long_g_pow[0][1],
           stride_idx, idx, long_g_pow[0][2],
           stride_idx, idx, long_g_pow[1][0],
           stride_idx, idx, long_g_pow[1][1],
           stride_idx, idx, long_g_pow[1][2])
            elif exp == 0:
                ret_append = '''
    powers[{}][{}][0][0] = {};
    powers[{}][{}][0][1] = {};
    powers[{}][{}][0][2] = {};
    powers[{}][{}][1][0] = {};
    powers[{}][{}][1][1] = {};
    powers[{}][{}][1][2] = {};
'''.format(stride_idx, idx, 0,
           stride_idx, idx, 0,
           stride_idx, idx, 0,
           stride_idx, idx, 0,
           stride_idx, idx, 0,
           stride_idx, idx, 0)
            ret_str = ret_str + ret_append
    ret_str = ret_str + '''
    return powers;
}
'''
    return ret_str

def get_ecdsa_func_str(n, k, stride_list):
    ret_str = '''pragma circom 2.0.2;
'''
    for stride in stride_list:
        cache_str = get_cache_str(n, k, stride)
        ret_str = ret_str + cache_str
    return ret_str

stride_list = [10]
ecdsa_func_str = get_ecdsa_func_str(86, 3, stride_list)
print(ecdsa_func_str)
