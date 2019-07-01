import re
from sys import argv
import hashlib

def escape (l):
    return list(map(lambda x: x.replace('"', '\\"'), l))

def md5(s):
    return hashlib.md5(s.encode()).hexdigest()

form = open('form.txt', encoding='utf-8').read()
data = open(argv[1], encoding='utf-8').read().strip().split('\n')[1:]

out = [data[0]]
for _ in range(4):
    out.extend([data[0], md5(data[1])])
    data = data[2:]

out.extend(escape(data[:58]))
data = data[58:]

v3 = data[:12]
data = data[12:]
for i in [1,4,7,10]:
    v3[i] = '["'+'","'.join(v3[i].split('|'))+'"]'

out.extend(v3)
out.extend(escape(data))

form = re.sub(r'{(?!})', '~', form)
form = re.sub(r'(?<!{)}', '`', form)

res = form.format(*out)
res = res.replace('~', '{').replace('`', '}')

open('result.json', 'w+', encoding='utf-8').write(res)
