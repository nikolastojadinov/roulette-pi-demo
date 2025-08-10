
// netlify/functions/piProxy.js

exports.handler = async function (event, context) {
  try {
    const response = await fetch("https://api.minepi.com/v2/me", {
      headers: {
        "Authorization": "Bearer qhhwpcgqxluzb8ezdgjpdbkkylmrnm80b6dwpmeel3wqn7hvz3zi8lb8vd0dc9o1"
      }
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ ok: false, msg: "Error from Pi API" })
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, data })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, msg: error.message })
    };
  }
};
