(async function() {
  try {
    const tokenRes = await fetch("https://www.roundhillinvestments.com/assets/php/server.php", {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.roundhillinvestments.com/etf/ybtc/"
      }
    });
    const token = await tokenRes.text();
    const cookie = tokenRes.headers.get("set-cookie");
    console.log("Got token:", token.trim(), "Cookie:", cookie);

    const payload = new URLSearchParams({
        upperetf: 'YBTC',
        loweretf: 'ybtc',
        token: token.trim(),
        is_ajax: '1'
    });

    const headers = { 
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Cookie": cookie || '',
        "Referer": "https://www.roundhillinvestments.com/etf/ybtc/",
        "User-Agent": "Mozilla/5.0",
        "X-Requested-With": "XMLHttpRequest",
        "Origin": "https://www.roundhillinvestments.com",
        "Accept": "*/*"
    };

    const res = await fetch("https://www.roundhillinvestments.com/assets/php/distribution-call.php", {
      method: "POST",
      headers,
      body: payload
    });
    const text = await res.text();
    console.log("Response:", text.substring(0, 500));
  } catch(e) { console.error(e) }
})();
