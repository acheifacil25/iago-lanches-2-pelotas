import re
from pathlib import Path

def test_f_keys_and_login_contracts():
    html_path = Path(r"C:\Users\Oem\.gemini\antigravity\scratch\delivery-pelotas\index.html")
    assert html_path.exists(), "index.html must exist"
    content = html_path.read_text(encoding="utf-8")

    # 1. Regex para F1 a F12
    f_match_pattern = r"const fMatch = \(e\.key \|\| \"\"\)\.match\(\/\^F\(\[1-9\]\|1\[0-2\]\)\$\/i\);"
    assert re.search(f_match_pattern, content), "F1..F12 keydown regex must be present"

    # Test the regex behavior directly
    regex = re.compile(r"^F([1-9]|1[0-2])$", re.IGNORECASE)
    for i in range(1, 13):
        m = regex.match(f"F{i}")
        assert m is not None, f"F{i} must match regex"
        assert int(m.group(1)) == i
    assert regex.match("F13") is None
    assert regex.match("F0") is None

    # 2. window functions for login
    assert "window.handleLoginSubmit" in content, "window.handleLoginSubmit must exist"
    assert "window.toggleCustomLoginName" in content, "window.toggleCustomLoginName must exist"
    assert "window.submitMotoboyLogin" in content, "window.submitMotoboyLogin must exist"

    # 3. Botao de login no DOM
    assert 'id="btn-entrar-app"' in content, "btn-entrar-app must exist"
    assert 'onclick="window.handleLoginSubmit()"' in content, "btn-entrar-app must trigger window.handleLoginSubmit()"

    # 4. onChangeActiveMotoboy focuses barcode-manual-input
    assert 'document.getElementById("barcode-manual-input")' in content
    assert 'inp.focus()' in content or 'input.focus()' in content

    # 5. Logo MTB presente
    assert 'alt="MTB Logo"' in content

    # 6. Optimistic UI na conclusao da entrega (sem travar em loading)
    assert 'window.finishMotoboyDeliveryNow = function(ticketToFinish)' in content
    assert 'renderMotoboyAppUI(' in content
    assert 'Promise.allSettled(promises)' in content
    assert 'AbortController()' in content
    assert 'payload.type === "DELIVERED"' in content

