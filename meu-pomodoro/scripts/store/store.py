"""Gera os gráficos da Play Store do Meu Pomodoro (mesmo método do Minha Bíblia).

Uso:  pip install playwright && python -m playwright install chromium
      python scripts/store/store.py

Saída em store/play-store/: ícone 512, gráfico de destaque 1024×500 e
6 capturas 1080×1920 (mockups fiéis às telas atuais do app).
"""
import base64
from pathlib import Path
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
FONTS = HERE / 'fonts'
OUT = ROOT / 'store' / 'play-store'
OUT.mkdir(parents=True, exist_ok=True)
ICON_SVG = (HERE / 'icon-source.svg').read_text(encoding='utf-8')

ION = {  # Ionicons 7 (mesmos ícones do app)
 'timer-outline': '<path d="M112.91 128A191.85 191.85 0 0064 254c-1.18 106.35 85.65 193.8 192 194 106.2.2 192-85.83 192-192 0-104.54-83.55-189.61-187.5-192a4.36 4.36 0 00-4.5 4.37V152" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path d="M233.38 278.63l-79-113a8.13 8.13 0 0111.32-11.32l113 79a32.5 32.5 0 01-37.25 53.26 33.21 33.21 0 01-8.07-7.94z"/>',
 'stats-chart-outline': '<rect x="64" y="320" width="48" height="160" rx="8" ry="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><rect x="288" y="224" width="48" height="256" rx="8" ry="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><rect x="400" y="112" width="48" height="368" rx="8" ry="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><rect x="176" y="32" width="48" height="448" rx="8" ry="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>',
 'settings-outline': '<path d="M262.29 192.31a64 64 0 1057.4 57.4 64.13 64.13 0 00-57.4-57.4zM416.39 256a154.34 154.34 0 01-1.53 20.79l45.21 35.46a10.81 10.81 0 012.45 13.75l-42.77 74a10.81 10.81 0 01-13.14 4.59l-44.9-18.08a16.11 16.11 0 00-15.17 1.75A164.48 164.48 0 01325 400.8a15.94 15.94 0 00-8.82 12.14l-6.73 47.89a11.08 11.08 0 01-10.68 9.17h-85.54a11.11 11.11 0 01-10.69-8.87l-6.72-47.82a16.07 16.07 0 00-9-12.22 155.3 155.3 0 01-21.46-12.57 16 16 0 00-15.11-1.71l-44.89 18.07a10.81 10.81 0 01-13.14-4.58l-42.77-74a10.8 10.8 0 012.45-13.75l38.21-30a16.05 16.05 0 006-14.08c-.36-4.17-.58-8.33-.58-12.5s.21-8.27.58-12.35a16 16 0 00-6.07-13.94l-38.19-30A10.81 10.81 0 0149.48 186l42.77-74a10.81 10.81 0 0113.14-4.59l44.9 18.08a16.11 16.11 0 0015.17-1.75A164.48 164.48 0 01187 111.2a15.94 15.94 0 008.82-12.14l6.73-47.89A11.08 11.08 0 01213.23 42h85.54a11.11 11.11 0 0110.69 8.87l6.72 47.82a16.07 16.07 0 009 12.22 155.3 155.3 0 0121.46 12.57 16 16 0 0015.11 1.71l44.89-18.07a10.81 10.81 0 0113.14 4.58l42.77 74a10.8 10.8 0 01-2.45 13.75l-38.21 30a16.05 16.05 0 00-6.05 14.08c.33 4.14.55 8.3.55 12.47z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>',
 'refresh': '<path d="M320 146s24.36-12-64-12a160 160 0 10160 160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 58l80 80-80 80"/>',
 'play': '<path d="M133 440a35.37 35.37 0 01-17.5-4.67c-12-6.8-19.46-20-19.46-34.33V111c0-14.37 7.46-27.53 19.46-34.33a35.13 35.13 0 0135.77.45l247.85 148.36a36 36 0 010 61l-247.89 148.4A35.5 35.5 0 01133 440z"/>',
 'pause': '<path d="M208 432h-48a16 16 0 01-16-16V96a16 16 0 0116-16h48a16 16 0 0116 16v320a16 16 0 01-16 16zM352 432h-48a16 16 0 01-16-16V96a16 16 0 0116-16h48a16 16 0 0116 16v320a16 16 0 01-16 16z"/>',
 'play-skip-forward': '<path d="M400 64a16 16 0 00-16 16v136.43L151.23 77.11a35.13 35.13 0 00-35.77-.44C103.46 83.47 96 96.63 96 111v290c0 14.37 7.46 27.53 19.46 34.33a35.14 35.14 0 0035.77-.45L384 295.57V432a16 16 0 0032 0V80a16 16 0 00-16-16z"/>',
 'star-outline': '<path d="M480 208H308L256 48l-52 160H32l140 96-54 160 138-100 138 100-54-160z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="32"/>',
 'mail-outline': '<rect x="48" y="96" width="416" height="320" rx="40" ry="40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M112 160l144 112 144-112"/>',
 'star': '<path d="M394 480a16 16 0 01-9.39-3L256 383.76 127.39 477a16 16 0 01-24.55-18.08L153 310.35 23 221.2a16 16 0 019-29.2h160.38l48.4-148.95a16 16 0 0130.44 0l48.4 149H480a16 16 0 019.05 29.2L359 310.35l50.13 148.53A16 16 0 01394 480z"/>',
}


def ic(name, size=20, color='currentColor'):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 512 512" fill="{color}" '
            f'style="color:{color};display:block">{ION[name]}</svg>')


def font(family, weight, file):
    # Embutida em base64: página criada com set_content não carrega file://.
    data = base64.b64encode((FONTS / file).read_bytes()).decode()
    return f"@font-face{{font-family:{family};font-weight:{weight};src:url(data:font/woff2;base64,{data}) format('woff2')}}"


CSS = ''.join([
    font('Q', 600, 'quicksand-latin-600-normal.woff2'), font('Q', 700, 'quicksand-latin-700-normal.woff2'),
    font('I', 400, 'inter-latin-400-normal.woff2'), font('I', 500, 'inter-latin-500-normal.woff2'),
    font('I', 600, 'inter-latin-600-normal.woff2'), font('I', 700, 'inter-latin-700-normal.woff2'),
]) + """
:root{--bg:#FAF6EE;--surface:#fff;--primary:#2B6E52;--ps:#1F5540;--psoft:#E4EFE6;--fg:#2B2620;--muted:#83786C;
--border:#E9E2D6;--warn-soft:#F6E8CE;--mus:#C9922E;--error:#8B3A4B;--error-soft:#F3E1E4;--tomato:#C24B3A;--tsoft:#F7E3DF}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:I,'Noto Color Emoji';color:var(--fg);background:#ccc}
.shot{width:360px;height:640px;position:relative;overflow:hidden;background:var(--primary)}
.shot.alt{background:var(--bg)}
.cap{position:absolute;top:44px;left:0;right:0;text-align:center;padding:0 28px}
.cap h2{font-family:Q,'Noto Color Emoji';font-weight:700;font-size:27px;line-height:1.18;color:#fff;letter-spacing:-.2px}
.cap p{font-size:13.5px;line-height:1.45;color:#D3E6D9;margin-top:10px}
.alt .cap h2{color:var(--ps)} .alt .cap p{color:var(--muted)}
.phone{position:absolute;left:50%;top:178px;transform:translateX(-50%);width:276px;height:520px;border:7px solid #2B2620;
  border-bottom:none;border-radius:34px 34px 0 0;overflow:hidden;background:var(--bg);box-shadow:0 18px 50px rgba(0,0,0,.28)}
.alt .phone{box-shadow:0 18px 50px rgba(43,38,32,.22)}
.scr{width:360px;height:680px;transform:scale(.728);transform-origin:0 0;background:var(--bg);position:relative;display:flex;flex-direction:column}
.sb{height:26px;flex:none;display:flex;justify-content:space-between;align-items:center;padding:0 18px;font-size:11px;font-weight:600}
.hdr{text-align:center;padding:10px 0;font-size:19px;font-weight:700;color:var(--ps);flex:none}
.main{flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 18px 24px}
.tk{margin:0 4px;position:relative}
.tk .in{background:var(--surface);border-radius:16px;padding:26px 22px 22px;box-shadow:0 6px 22px rgba(43,38,32,.08)}
.zz{position:absolute;left:8px;right:8px;height:12px;display:flex;justify-content:space-between;overflow:hidden}
.zz.t{top:-6px} .zz.b{bottom:-6px}
.zz i{width:12px;height:12px;background:var(--bg);transform:rotate(45deg);flex:none}
.chip{display:table;margin:0 auto 16px;border-radius:99px;padding:6px 16px;font-size:12px;font-weight:700;letter-spacing:.1em}
.chip.f{background:var(--tsoft);color:var(--tomato)} .chip.b{background:var(--psoft);color:var(--ps)}
.time{text-align:center;font-size:58px;line-height:62px;font-weight:700;margin-bottom:6px;font-variant-numeric:tabular-nums;letter-spacing:-1px}
.ends{text-align:center;font-size:12.5px;color:var(--muted);margin-bottom:16px;height:18px}
.bar{height:8px;border-radius:8px;background:var(--border);overflow:hidden;margin-bottom:16px}
.bar i{display:block;height:100%;border-radius:8px}
.dots{display:flex;justify-content:center;gap:10px;margin-bottom:6px}
.dots i{width:12px;height:12px;border-radius:50%;background:var(--border)}
.dots i.d{background:var(--tomato)} .dots i.c{background:#fff;border:3px solid var(--tomato)}
.small{text-align:center;font-size:12px;color:var(--muted)}
.task{margin-top:14px;border-top:1px dashed var(--border);padding-top:14px;text-align:center;font-size:13px;color:var(--muted)}
.inp{margin-top:6px;border-radius:12px;background:var(--warn-soft);padding:10px 14px;text-align:center;font-size:14px;color:var(--fg)}
.ctr{margin-top:18px;display:flex;gap:10px;align-items:center;padding:0 4px}
.sq{width:50px;height:50px;border-radius:12px;background:var(--psoft);display:flex;align-items:center;justify-content:center;flex:none}
.mainbtn{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;background:var(--primary);padding:15px 0;color:#fff;font-size:15px;font-weight:600}
.tabs{height:64px;flex:none;background:#fff;border-top:.5px solid var(--border);display:flex;justify-content:space-around;align-items:center;padding-bottom:4px}
.tab{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:11px;font-weight:600;color:var(--muted);width:110px}
.tab.on{color:var(--primary)}
.btn{min-height:48px;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;font-size:15px;font-weight:600}
.btn.p{background:var(--primary);color:#fff} .btn.s{background:var(--psoft);color:var(--ps)} .btn.d{background:var(--error-soft);color:var(--error)}
.done{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 24px}
.stats{display:flex;justify-content:space-around;align-self:stretch;border:1px solid var(--border);background:#fff;border-radius:16px;padding:16px 0;margin-bottom:22px}
.st{text-align:center} .st b{display:block;font-size:20px;color:var(--ps)} .st span{font-size:11px;color:var(--muted)}
.seg{display:flex;border:1px solid var(--border);background:#fff;border-radius:12px;padding:4px;margin-bottom:14px}
.seg div{flex:1;text-align:center;padding:8px 0;border-radius:9px;font-size:13px;font-weight:600;color:var(--muted)}
.seg .on{background:var(--primary);color:#fff}
.sc{flex:1;text-align:center;border:1px solid var(--border);background:#fff;border-radius:16px;padding:14px 0}
.sc b{display:block;font-size:24px;color:var(--ps)} .sc span{font-size:11.5px;color:var(--muted)}
.item{display:flex;align-items:center;gap:12px;border:1px solid var(--border);background:#fff;border-radius:14px;padding:12px 14px;margin-bottom:10px}
.em{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:17px;flex:none}
.it{flex:1;min-width:0} .it b{display:block;font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .it span{font-size:11.5px;color:var(--muted)}
.pill{border-radius:99px;padding:4px 9px;font-size:10.5px;font-weight:600}
.card{border:1px solid var(--border);background:#fff;border-radius:16px;padding:16px;margin-bottom:14px}
.card h4{font-size:14px;color:var(--ps);margin-bottom:6px}
.row{display:flex;align-items:center;justify-content:space-between;padding:7px 0}
.row .l{font-size:14px;font-weight:500} .row .sl{font-size:11.5px;color:var(--muted);margin-top:2px}
.stp{display:flex;align-items:center;gap:6px}
.stp i{width:34px;height:34px;border-radius:8px;background:var(--psoft);color:var(--ps);font-style:normal;font-weight:700;font-size:17px;display:flex;align-items:center;justify-content:center}
.stp b{min-width:62px;text-align:center;font-size:14px;color:var(--ps)}
.sw{width:40px;height:22px;border-radius:11px;background:var(--border);position:relative;flex:none}
.sw:after{content:"";position:absolute;left:2px;top:2px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25)}
.sw.on{background:var(--primary)} .sw.on:after{left:20px}
.notif{position:absolute;left:10px;right:10px;top:34px;background:#fff;border-radius:18px;padding:12px 14px;box-shadow:0 8px 28px rgba(43,38,32,.25);display:flex;gap:10px;z-index:5}
.notif .ni{width:22px;height:22px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;flex:none}
.notif .nh{font-size:11px;color:var(--muted)} .notif b{display:block;font-size:13.5px;margin-top:2px} .notif p{font-size:13px;color:var(--fg);line-height:18px}
#feature{width:1024px;height:500px;background:var(--bg);position:relative;overflow:hidden}
"""

STATUS = '<div class="sb"><span>10:00</span><span>▴ ◢ ▮</span></div>'
ZZ = ''.join('<i></i>' for _ in range(22))


def tabs(on):
    items = [('timer-outline', 'Pomodoro'), ('stats-chart-outline', 'Histórico'), ('settings-outline', 'Configurações')]
    return '<div class="tabs">' + ''.join(
        f'<div class="tab{" on" if label == on else ""}">{ic(n, 26, "#2B6E52" if label == on else "#83786C")}<span>{label}</span></div>'
        for n, label in items) + '</div>'


def ticket(inner):
    return f'<div class="tk"><div class="in">{inner}</div><div class="zz t">{ZZ}</div><div class="zz b">{ZZ}</div></div>'


def dots(done, current, total=4):
    return '<div class="dots">' + ''.join(
        f'<i class="{"d" if p <= done else ("c" if p == current else "")}"></i>' for p in range(1, total + 1)) + '</div>'


def controls(label, icon):
    return (f'<div class="ctr"><div class="sq">{ic("refresh", 20, "#1F5540")}</div>'
            f'<div class="mainbtn">{ic(icon, 18, "#fff")}{label}</div>'
            f'<div class="sq">{ic("play-skip-forward", 20, "#1F5540")}</div></div>')


def timer_screen(chip, time, ends, pct, color, done, current, label, footer, btn, btn_icon):
    inner = (f'{chip}<div class="time">{time}</div><div class="ends">{ends}</div>'
             f'<div class="bar"><i style="width:{pct}%;background:{color}"></i></div>'
             f'{dots(done, current)}<div class="small">{label}</div>{footer}')
    return (f'<div class="hdr">🍅 Meu Pomodoro</div><div class="main">{ticket(inner)}{controls(btn, btn_icon)}</div>'
            + tabs('Pomodoro'))


FOCO = timer_screen('<div class="chip f">FOCO</div>', '18:42', 'termina às 10:18', 25, 'var(--tomato)', 1, 2,
                    'Pomodoro 2 de 4', '<div class="task">Tarefa: Estudar Banco de Dados</div>', 'Pausar', 'pause')

TAREFA = timer_screen('<div class="chip f">FOCO</div>', '25:00', '', 0, 'var(--tomato)', 2, 3, 'Pomodoro 3 de 4',
                      '<div class="task" style="font-size:12px">O que você vai fazer?'
                      '<div class="inp">Revisar slides da aula</div></div>', 'Iniciar', 'play')

PAUSA = (timer_screen('<div class="chip b">☕ PAUSA CURTA</div>', '03:12', 'termina às 10:28', 36, 'var(--primary)', 2, None,
                      '2 Pomodoros concluídos neste ciclo', '<div class="task">🌿 Levante, alongue, respire</div>', 'Pausar', 'pause')
         .replace('<div class="hdr">', '<div class="notif"><div class="ni">🍅</div><div><div class="nh">Meu Pomodoro · agora</div>'
                  '<b>🍅 Meu Pomodoro</b><p>Pomodoro concluído!<br>Hora da pausa de 5 minutos.</p></div></div><div class="hdr">', 1))

CONCLUIDO = f'''<div class="hdr">🍅 Meu Pomodoro</div><div class="done">
<div style="font-size:52px;margin-bottom:14px">🎉</div>
<div style="font-size:24px;font-weight:700;color:var(--ps);margin-bottom:8px">Pomodoro concluído!</div>
<div style="font-size:14px;line-height:21px;color:var(--muted);text-align:center;margin-bottom:22px">Você merece um descanso. Levante e alongue um pouco.</div>
<div class="stats"><div class="st"><b>3</b><span>neste ciclo</span></div><div class="st"><b>7</b><span>hoje</span></div><div class="st"><b>2h55</b><span>de foco hoje</span></div></div>
<div class="btn p" style="align-self:stretch;margin-bottom:10px">Iniciar pausa curta</div>
<div class="btn s" style="align-self:stretch">Agora não</div></div>{tabs("Pomodoro")}'''

SESS = [('🍅', 'f', 'Estudar Banco de Dados', '09:10 · 25 min', True), ('☕', 'b', 'Pausa curta', '09:35 · 5 min', True),
        ('🍅', 'f', 'Revisar slides da aula', '09:40 · 25 min', True), ('☕', 'b', 'Pausa curta', '10:05 · 5 min', True),
        ('🍅', 'f', 'Responder e-mails', '10:10 · 25 min', True), ('🌿', 'b', 'Pausa longa', '10:35 · 2 min', False)]
HISTORICO = ('<div class="hdr">📊 Histórico</div><div style="flex:1;padding:0 16px;overflow:hidden">'
             '<div class="seg"><div class="on">Hoje</div><div>Semana</div></div>'
             '<div style="display:flex;gap:12px;margin-bottom:14px"><div class="sc"><b>7</b><span>Pomodoros</span></div>'
             '<div class="sc"><b>2h55</b><span>Tempo de foco</span></div></div>'
             + ''.join(f'<div class="item"><div class="em" style="background:var({"--tsoft" if k == "f" else "--psoft"})">{e}</div>'
                       f'<div class="it"><b>{t}</b><span>{m}</span></div>'
                       f'<span class="pill" style="background:var({"--psoft" if ok else "--error-soft"});color:var({"--ps" if ok else "--error"})">'
                       f'{"Concluído" if ok else "Pulado"}</span></div>' for e, k, t, m, ok in SESS)
             + '</div>' + tabs('Histórico'))


def step(v):
    return f'<div class="stp"><i>−</i><b>{v}</b><i>+</i></div>'


def toggle(label, sub, on):
    return (f'<div class="row"><div style="flex:1;padding-right:12px"><div class="l">{label}</div><div class="sl">{sub}</div></div>'
            f'<div class="sw{" on" if on else ""}"></div></div>')


CONFIG = f'''<div class="hdr">⚙️ Configurações</div><div style="flex:1;padding:0 16px;overflow:hidden">
<div class="card"><h4>Tempos</h4>
<div class="row"><div class="l">Foco</div>{step("25 min")}</div>
<div class="row"><div class="l">Pausa curta</div>{step("5 min")}</div>
<div class="row"><div class="l">Pausa longa</div>{step("15 min")}</div>
<div class="row"><div class="l">Pomodoros por ciclo</div>{step("4")}</div>
<div style="font-size:11.5px;color:var(--muted);margin-top:8px">Alterações valem a partir da próxima sessão.</div></div>
<div class="card"><h4>Comportamento</h4>
{toggle("Início automático", "Começa a próxima sessão sozinho", True)}
{toggle("Som", "Toca ao finalizar uma sessão", True)}
{toggle("Vibração", "Vibra ao finalizar uma sessão", True)}
{toggle("Manter tela ligada", "Enquanto o cronômetro estiver ativo", False)}</div></div>{tabs("Configurações")}'''

SHOTS = [
    ('01-foco', 'Foco total, um Pomodoro por vez', 'Cronômetro preciso que continua certo mesmo com o app fechado.', FOCO, False),
    ('02-tarefa', 'Diga no que vai focar', 'Anote a tarefa antes de começar e encontre tudo no histórico.', TAREFA, True),
    ('03-pausas', 'Pausas na hora certa', 'Aviso no fim de cada sessão, com pausas curtas e longas.', PAUSA, False),
    ('04-conclusao', 'Comemore cada Pomodoro', 'Veja o progresso do ciclo e o foco do dia a cada sessão.', CONCLUIDO, True),
    ('05-historico', 'Acompanhe sua produtividade', 'Pomodoros e tempo de foco de hoje e da semana.', HISTORICO, False),
    ('06-configuracoes', 'Do seu jeito', 'Ajuste tempos, som, vibração e início automático.', CONFIG, True),
]


def shot(sid, title, sub, screen, alt):
    return (f'<div class="shot{" alt" if alt else ""}" id="s{sid}"><div class="cap"><h2>{title}</h2><p>{sub}</p></div>'
            f'<div class="phone"><div class="scr">{STATUS}{screen}</div></div></div>')


def feature():
    n = 32
    zig = ' '.join(f'L{1024 / n * i + 1024 / n / 2:.1f},450 L{1024 / n * (i + 1):.1f},462' for i in range(n))
    mark = ICON_SVG.replace('width="1024" height="1024"', 'width="300" height="300"')
    return f'''<div id="feature">
<div style="position:absolute;left:84px;top:66px">{mark}</div>
<div style="position:absolute;left:420px;top:150px">
<div style="font-family:Q;font-weight:700;font-size:74px;line-height:1;color:var(--fg)">Meu Pomodoro</div>
<div style="font-size:28px;color:var(--muted);margin-top:22px">Ciclos de foco e pausa, sem distração.</div></div>
<svg style="position:absolute;left:0;top:0" width="1024" height="500"><path d="M0,462 {zig} L1024,500 L0,500Z" fill="#2B6E52"/></svg>
</div>'''


def main():
    icon_512 = ICON_SVG.replace('width="1024" height="1024"', 'width="512" height="512"')
    html = (f'<html><head><meta charset="utf-8"><style>{CSS}</style></head><body>'
            + ''.join(shot(*s) for s in SHOTS) + feature()
            + f'<div id="icon" style="width:512px;height:512px">{icon_512}</div>'
            + '</body></html>')
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(device_scale_factor=3, viewport={'width': 1100, 'height': 800})
        page.set_content(html)
        page.evaluate('document.fonts.ready')
        for sid, *_ in SHOTS:
            page.locator(f'#s{sid}').screenshot(path=str(OUT / f'screenshot-{sid}.png'))
        page2 = browser.new_page(device_scale_factor=1, viewport={'width': 1100, 'height': 800})
        page2.set_content(html)
        page2.evaluate('document.fonts.ready')
        page2.locator('#feature').screenshot(path=str(OUT / 'feature-graphic-1024x500.png'))
        page2.locator('#icon').screenshot(path=str(OUT / 'play-store-icon-512.png'))
        browser.close()
    print(f'Gráficos gerados em {OUT}')


if __name__ == '__main__':
    main()
