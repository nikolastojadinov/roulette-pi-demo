
export async function handler(event, context) {
  try {
    const apiKey = process.env.PI_API_KEY; // Uzimamo iz Netlify okruženja
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ ok: false, msg: "Missing PI_API_KEY in environment" }),
      };
    }

    const response = await fetch("https://api.minepi.com/v2/me", {
      headers: { Authorization: `Key ${apiKey}` },
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, data }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, msg: error.message }),
    };
  }
}
