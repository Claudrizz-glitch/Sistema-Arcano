"""Extrai bestiário e itens arcanos do PDF oficial SEM retipar nada. Gera seed/bestiary.json e seed/arcane_items.json e prova a integridade."""
import re, json, subprocess, sys, unicodedata
pdf = sys.argv[1]
raw = subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True).stdout.replace("\u200b", "").replace("\f", "\n")
lines = [l.rstrip() for l in raw.splitlines()]
def idx(s, start=0):
    for i in range(start, len(lines)):
        if lines[i].strip() == s: return i
    raise SystemExit("seção não encontrada: " + s)
b0, i0, a0 = idx("Bestiário"), idx("Itens Mágicos"), idx("Arcanismo")
norm = lambda t: re.sub(r"\s+", " ", t.replace("\ufe0f", "")).strip()

# ---------- bestiário ----------
BIOMES = ["Montanhas Alpinas", "Taiga (Floresta Boreal)", "Floresta Temperada", "Bosques e Planícies Arborizadas", "Campos e Pradarias", "Vales Fluviais", "Costas Rochosas", "Arquipélagos Oceânicos", "Terras Corrompidas", "Pântanos e Brejos", "Grandes Lagos"]
FAUNA_CREATURES = {"Montanhas Alpinas": ["Dragões de terra"], "Floresta Temperada": ["Unicórnio", "Claberto", "Gira-Gira", "Oraqui-Oralá", "Tronquilho"],
                   "Bosques e Planícies Arborizadas": ["Amasso"], "Campos e Pradarias": ["Erumpente", "Furanzão", "Pelúcio", "Dedo-Duro"]}
PROF = {1: ["Pufoso", "Gnomo", "Carbunclo"], 2: ["Pocotó", "Grindylow", "Pogrebin", "Alp", "Eco", "Encantado", "Will-o'-wisp", "Drekavac"],
        3: ["Hipogrifo", "Mímico", "Strix", "Jenny Greenteeth", "Ceasg", "Berggeist", "Leshy", "Mapinguari", "Cuca", "Revenant", "Nachzehrer", "Ammit Menor"],
        4: ["Mortalha-Viva", "Cavalo-do-Lago", "Devorador de Livros", "Acromântula", "Wendigo", "Bunyip", "Skin-Walker", "Leyak", "Stikini", "Jubokko", "Aswang", "Jiangshi", "Nuckelavee", "Nue", "Caoránach", "Charybdis", "Zmey", "Peskye dust", "Dorian Gray", "O Duplo"],
        5: ["Basilisco", "Manticora", "Falsa Hidra", "Nundu", "Quimera", "Baba Yaga", "Aspidochelone", "Shai-Hulud", "Slender Man", "Castelo dos Anjos", "The Silence", "O Coisa"]}
best = lines[b0:i0]
p0 = next(i for i, l in enumerate(best) if l.strip() == "Profanos")
fauna_lines, prof_lines = best[2:p0], best[p0 + 1:]

def split_by_starts(block, starts):
    """Divide `block` (lista de linhas) em entradas; cada entrada começa na linha que inicia com um dos nomes (em ordem)."""
    pos = []; cur = 0
    for name in starts:
        for i in range(cur, len(block)):
            if block[i].lstrip().startswith(name): pos.append(i); cur = i + 1; break
        else: raise SystemExit("início não encontrado: " + name)
    pos.append(len(block))
    return [(starts[k], "\n".join(block[pos[k]:pos[k + 1]]).strip()) for k in range(len(starts))], block[:pos[0]]

entries = []
# fauna & flora: biomas em ordem, criaturas dentro
order = []
for biome in BIOMES:
    order.append(("bioma", biome, biome.split(" (")[0]))
    for c in FAUNA_CREATURES.get(biome, []): order.append(("criatura", biome, c))
starts = [o[2] for o in order]
parts, pre = split_by_starts(fauna_lines, starts)
assert not [l for l in pre if l.strip()], "texto solto antes do primeiro bioma"
for (kind, biome, nm), (_, text) in zip(order, parts):
    e = {"name": nm if kind == "criatura" else biome, "kind": kind, "category": "fauna_flora", "periculosidade": None, "region": biome, "description": text}
    if kind == "bioma":
        m = re.search(r"Flora\s*[–-]\s*(.*?)\s*Fauna\s*[–-]\s*(.*)$", text, re.S)
        if m: e["flora"], e["fauna"] = norm(m.group(1)), norm(m.group(2).split("\n\n")[0]) if False else None
    entries.append(e)
# profanos por periculosidade
cur = 0; pblock = prof_lines
heads = {}
for lvl in range(1, 6):
    heads[lvl] = next(i for i, l in enumerate(pblock) if l.strip() == f"Periculosidade {['I','II','III','IV','V'][lvl-1]}")
bounds = [heads[l] for l in range(1, 6)] + [len(pblock)]
for lvl in range(1, 6):
    seg = pblock[bounds[lvl - 1] + 1: bounds[lvl]]
    parts, pre = split_by_starts(seg, PROF[lvl])
    assert not [l for l in pre if l.strip()], f"texto solto antes de {PROF[lvl][0]}"
    for nm, text in parts:
        entries.append({"name": nm, "kind": "criatura", "category": "profano", "periculosidade": lvl, "region": None, "description": text})

# ---------- itens arcanos ----------
items_lines = lines[i0 + 1:a0]
is_emoji = lambda c: ord(c) >= 0x1F000 or 0x2600 <= ord(c) <= 0x27BF
heads = [i for i, l in enumerate(items_lines) if l.strip() and is_emoji(l.strip()[0])]
arc = []
for k, h in enumerate(heads):
    end = heads[k + 1] if k + 1 < len(heads) else len(items_lines)
    head = items_lines[h].strip()
    name = re.sub(r"^[^\w]+", "", head.replace("\ufe0f", "")).strip()
    arc.append({"emoji": head[: len(head) - len(name)].strip(), "name": name, "description": "\n".join(items_lines[h + 1:end]).strip()})

# ---------- prova de integridade (ida e volta) ----------
src = norm(" ".join(l for l in best[1:] if l.strip() not in ("Fauna & Flora", "Profanos", "Periculosidade I", "Periculosidade II", "Periculosidade III", "Periculosidade IV", "Periculosidade V")))
got = norm(" ".join(e["description"] for e in entries))
print("bestiário: entradas =", len(entries), "| biomas =", sum(e["kind"] == "bioma" for e in entries), "| criaturas fauna =", sum(e["kind"] == "criatura" and e["category"] == "fauna_flora" for e in entries),
      "| profanos =", sum(e["category"] == "profano" for e in entries))
print("por periculosidade:", {l: sum(e["periculosidade"] == l for e in entries) for l in range(1, 6)})
print("INTEGRIDADE bestiário (texto original == soma das entradas):", src == got, len(src), len(got))
isrc = norm(" ".join(items_lines)); iget = norm(" ".join((a["emoji"] + " " + a["name"] + " " + a["description"]) for a in arc))
print("itens arcanos:", len(arc), [a["name"] for a in arc])
print("INTEGRIDADE itens (texto original == soma):", isrc == iget, len(isrc), len(iget))
json.dump(entries, open("seed/bestiary.json", "w"), ensure_ascii=False, indent=1)
json.dump(arc, open("seed/arcane_items.json", "w"), ensure_ascii=False, indent=1)
