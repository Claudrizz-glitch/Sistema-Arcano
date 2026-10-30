"""Extrai as tabelas de progressão do PDF oficial. Nada é digitado à mão."""
import re, json, subprocess, sys
pdf = sys.argv[1]
txt = subprocess.run(["pdftotext","-layout",pdf,"-"],capture_output=True,text=True).stdout
txt = txt.replace("\u200b","")
row = re.compile(r"Nível\s+(\d+)\s+—\s+(?:Vida\s+(\d+)\s*\|?\s*)?(?:Mana\s+(\d+)\s*\|?\s*)?(\d+)d(\d+)")
rows=[]
for m in row.finditer(txt):
    rows.append((m.start(),int(m[1]),m[2] and int(m[2]),m[3] and int(m[3]),int(m[4]),int(m[5])))
blocks=[]; cur=[]
for r in rows:
    if r[1]==1 and cur: blocks.append(cur); cur=[]
    cur.append(r)
if cur: blocks.append(cur)
names=["humano","anao","druida","profano","forjado","druida_puro"]
assert len(blocks)==6, f"esperava 6 tabelas, achei {len(blocks)}"
out={}
for n,b in zip(names,blocks):
    assert [x[1] for x in b]==list(range(1,22)), (n,"níveis incompletos")
    out[n]=[{"level":x[1],"max_hp":x[2],"max_mana":x[3],"aa_dice_count":x[4],"aa_dice_sides":x[5]} for x in b]
json.dump(out,open("seed/progressions.json","w"),ensure_ascii=False,indent=1)
for n in names:
    t=out[n]; print(n,len(t),"hp1=",t[0]["max_hp"],"mana1=",t[0]["max_mana"],"hp21=",t[20]["max_hp"],"mana21=",t[20]["max_mana"],"aa=",sorted({(r['aa_dice_count'],r['aa_dice_sides']) for r in t}))
