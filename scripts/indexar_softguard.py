#!/usr/bin/env python3
"""Indexa un manual SoftGuard (PDF o .txt extraído) para el Manual Inteligente.

Genera prototipo/datos/softguard/<id>.js (texto por página + secciones) y suma el
manual a prototipo/datos/softguard/indice.js. Nunca borra manuales ni versiones
anteriores: cada versión lleva su propio <id>.

Uso:
  python3 scripts/indexar_softguard.py ENTRADA.(pdf|txt) --id tec167-rd181220 \
      --codigo "TEC 167" --titulo "Monitoreo Web" --version "RD 181220" [--actual]

La página citada es la página del PDF (la primera es la carátula).
"""
import argparse, json, re, subprocess, sys
from pathlib import Path

DEST = Path(__file__).resolve().parent.parent / "prototipo" / "datos" / "softguard"
SECCION = re.compile(r"^(\d{1,2}(?:\.\d{1,2}){0,3})\.?\s+([A-ZÁÉÍÓÚÑ¿][^\n]{2,70})$", re.M)
PIE = re.compile(r"^(SoftGuard\s+[–-]\s+\d+.*|Phone\s+\+?\d.*softguard\.com.*)$", re.M)


def paginas_txt(texto):
    """El .txt trae, por página: 'TEC: ... RD: ...' / número / pie SoftGuard."""
    partes = re.split(r"^TEC: [^\n]*\n(\d{1,4})\n", texto, flags=re.M)
    out = []
    for i in range(1, len(partes), 2):
        out.append((int(partes[i]), partes[i + 1]))
    return out


def paginas_pdf(ruta):
    r = subprocess.run(["pdftotext", "-layout", str(ruta), "-"], capture_output=True, text=True, check=True)
    return [(n, t) for n, t in enumerate(r.stdout.split("\f"), 1) if t.strip()]


def limpiar(t):
    t = PIE.sub("", t)
    t = re.sub(r"[ \t]+\n", "\n", t)
    return re.sub(r"\n{3,}", "\n\n", t).strip()


def js(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("entrada")
    ap.add_argument("--id", required=True)
    ap.add_argument("--codigo", required=True)
    ap.add_argument("--titulo", required=True)
    ap.add_argument("--version", required=True)
    ap.add_argument("--pdf", default="", help="ruta del PDF relativa a prototipo/ (por defecto manuales/softguard/<id>.pdf)")
    ap.add_argument("--actual", action="store_true", help="marca esta versión como la vigente de su código")
    a = ap.parse_args()

    src = Path(a.entrada)
    paginas = paginas_pdf(src) if src.suffix.lower() == ".pdf" else paginas_txt(src.read_text(encoding="utf-8"))
    if not paginas:
        sys.exit("No se encontraron páginas en la entrada.")
    paginas = [(n, limpiar(t)) for n, t in paginas]

    secciones = []
    for n, t in paginas:
        if n <= 3:  # carátula e índice
            continue
        for m in SECCION.finditer(t):
            secciones.append([m.group(1), m.group(2).strip(), n])

    DEST.mkdir(parents=True, exist_ok=True)
    meta = {"id": a.id, "codigo": a.codigo, "titulo": a.titulo, "version": a.version,
            "pdf": a.pdf or f"manuales/softguard/{a.id}.pdf", "paginas": len(paginas), "actual": a.actual}
    (DEST / f"{a.id}.js").write_text(
        "/* Generado por scripts/indexar_softguard.py. No editar a mano. */\n"
        f"(window.SG_MANUALES=window.SG_MANUALES||{{}})[{js(a.id)}]="
        f"{{meta:{js(meta)},secciones:{js(secciones)},paginas:{js([[n, t] for n, t in paginas])}}};\n",
        encoding="utf-8")

    idx_path = DEST / "indice.js"
    indice = []
    if idx_path.exists():
        indice = json.loads(re.search(r"=\s*(\[.*\]);", idx_path.read_text(encoding="utf-8"), re.S).group(1))
    indice = [m for m in indice if m["id"] != a.id]  # reindexar la misma versión la reemplaza
    if a.actual:
        for m in indice:
            if m["codigo"] == a.codigo:
                m["actual"] = False
    indice.append(meta)
    idx_path.write_text("/* Lista de manuales indexados. Generado por scripts/indexar_softguard.py */\n"
                        f"window.SG_INDICE={js(indice)};\n", encoding="utf-8")
    print(f"{a.id}: {len(paginas)} páginas, {len(secciones)} secciones -> {DEST}")


if __name__ == "__main__":
    main()
