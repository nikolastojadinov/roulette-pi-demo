const API_KEY = "qhhwpcgqxluzb8ezdgjpdbkkylmrnm80b6dwpmeel3wqn7hvz3zi8lb8vd0dc9o1";

export async function handler(event) {
  try {
    const res = await fetch("https://api.minepi.com/v2/me", {
      headers: { "Authorization": `Key ${API_KEY}` }
    });

    const text = await res.text();

    return {
      statusCode: res.status,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*"
      },
      body: JSON.stringify({
        status: res.status,
        ok: res.ok,
        sample: text.slice(0, 200)
      })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, error: e.message })
    };
  }
}
