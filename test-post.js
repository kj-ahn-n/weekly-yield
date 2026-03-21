(async function() {
  try {
    const tokenRes = await fetch("https://www.roundhillinvestments.com/assets/php/server.php");
    const token = await tokenRes.text();
    console.log("Got token:", token.trim());

    const payload = new URLSearchParams({
        upperetf: 'YBTC',
        loweretf: 'ybtc',
        token: token.trim(),
        is_ajax: '1'
    });

    const res = await fetch("https://www.roundhillinvestments.com/assets/php/distribution-call.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload
    });
    const text = await res.text();
    console.log("Response:", text.substring(0, 300));
  } catch(e) { console.error(e) }
})();
