import express from "express";
import axios from "axios";
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN, PORT } = process.env;

let rate = "";

const sendWhatsAppMessage = async (businessPhoneNumberId, data) => {
  try {
    const response = await axios({
      method: "POST",
      url: `https://graph.facebook.com/v20.0/${businessPhoneNumberId}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
      },
      data,
    });
    console.log("Response:", response.status);
    return response;
  } catch (error) {
    console.error("Error:", error.response.data);
    throw error;
  }
};

app.post("/webhook", async (req, res) => {
  const contacts = req.body?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.wa_id;
  const messages = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  const businessPhoneNumberId = req.body.entry?.[0].changes?.[0]?.value?.metadata?.phone_number_id;

  console.log("messages", messages);
  if (!contacts || !messages || !businessPhoneNumberId) {
    return res.sendStatus(400);
  }

  try {
    if (messages?.interactive?.list_reply?.id.includes("rating")) {
      rate = messages?.interactive?.list_reply?.id;
      await sendWhatsAppMessage(
        businessPhoneNumberId,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: contacts,
          type: "interactive",
          interactive: {
            type: "list",
            body: { text: "How likely are you to recommend Greenwall Dental Clinic?\n" },
            action: {
              button: "Rate Now",
              sections: [
                {
                  title: "Rating Scale",
                  rows: [
                    { id: "q2_rate_5", title: "5 - Extremely Likely" },
                    { id: "q2_rate_4", title: "4 - Likely" },
                    { id: "q2_rate_3", title: "3 - Neutral" },
                    { id: "q2_rate_2", title: "2 - Unlikely" },
                    { id: "q2_rate_1", title: "1 - Not at all Likely" },
                  ],
                },
              ],
            },
          },
        }
      );
    } else if (messages?.interactive?.list_reply?.id.includes("rate")) {
      if (messages?.interactive?.list_reply?.id === "q2_rate_5" || rate === "rating_5") {
        await sendWhatsAppMessage(
          businessPhoneNumberId,
          {
            messaging_product: "whatsapp",
            to: contacts,
            type: "interactive",
            interactive: {
              type: "button",
              body: {
                text: `Thank you for providing your feedback! It helps us improve our service. \n\nPlease could you rate and review us on google. It helps us grow and continue to deliver impactful work. \nhttps://maps.app.goo.gl/G4Z55yho36w46Amt7?g_st=iw`
              },
              action: {
                buttons: [
                  {
                    type: "reply",
                    reply: {
                      id: "acknowledge_feedback",
                      title: "Acknowledge"
                    }
                  }
                ]
              }
            }
          }
        );
      } else {
        await sendWhatsAppMessage(
          businessPhoneNumberId,
          {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: contacts,
            type: "interactive",
            interactive: {
              type: "button",
              body: { text: "Was there anything we could have done to improve your experience?" },
              action: {
                buttons: [
                  {
                    type: "reply",
                    reply: {
                      id: "improve_experience_yes",
                      title: "Yes",
                    },
                  },
                  {
                    type: "reply",
                    reply: {
                      id: "improve_experience_no",
                      title: "No",
                    },
                  }
                ]
              },
            },
            context: { message_id: messages.id },
          }
        );
      }
    } else if (messages?.type === "interactive" && messages?.interactive?.button_reply?.id === "improve_experience_yes") {
        await sendWhatsAppMessage(
          businessPhoneNumberId,
          {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: contacts,
            type: "interactive",
            interactive: {
              type: "button",
              body: { text: "What could we do to make your experience ten times better?" },
              action: {
                buttons: [
                  {
                    type: "reply",
                    reply: {
                      id: "thanks_feedback",
                      title: "Acknowledge",
                    },
                  },
                ]
              },
            },
            context: { message_id: messages.id },
          }
        );
    }
  } catch (error) {
    console.error("Error handling message:", error);
  }

  res.sendStatus(200);
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
    console.log("Webhook verified successfully!");
  } else {
    res.sendStatus(403);
  }
});

app.get("/", (req, res) => {
  res.send(`
    <pre>
    Nothing to see here.
    Check out README.md to start.
    </pre>
  `);
});

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
