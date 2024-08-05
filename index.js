import express from "express";
import axios from "axios";
import 'dotenv'

const app = express();
app.use(express.json());
const { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN, PORT } = process.env;

app.post("/webhook", async (req, res) => {
//   console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));

const contacts=req.body?.entry[0]?.changes[0]?.value?.contacts?.[0]?.wa_id
const messages=req.body?.entry[0]?.changes[0]?.value?.messages?.[0]?.interactive?.nfm_reply?.response_json
const data=messages?JSON.parse(messages):"none"
const data1=data?.screen_0_RadioButtonsGroup_0
const data2=data?.screen_0_RadioButtonsGroup_1
console.log("conatct",contacts)
console.log("messages",messages)
  // check if the webhook request contains a message
  // details on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];

  // check if the incoming message contains text
  if(message){
  const business_phone_number_id =
  req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;

  try{
    const res2= await axios({
        method: "POST",
        url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          to: message.from,
          text: { body: "Thanks for providing feedback to us" },
        context: {
          message_id: message.id, // shows the message as a reply to the original user message
        },
        },
      });
      console.log("res2",res2.status)
  }catch(err){
    console.log("res2",err)
  }
}
  if (data1=="0_★★★★★_•_Excellent_(5\/5)"||data2=="0_★★★★★_•_Excellent_(5\/5)") {
    // extract the business number to send the reply from it
    const business_phone_number_id =
      req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;

    // send a reply message as per the docs here https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
   try{
    
 const res= await axios({
      method: "POST",
      url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        to: message.from,
        type:"template",
        template: {
       name: "google_reveiw",
       language: {
           code: "en"
       },
       components: [
           {
               type: "button",
               sub_type: "URL",
               index: 0,
               parameters: [
                   {
                       type: "text",
                       text: "G4Z55yho36w46Amt7?g_st=iw"
                   }
               ]
           }
       ]
   }
      },
    });

    console.log("res",res.status)
}catch(err){
    console.log("messages",err)
}

    // mark incoming message as read
    try{
    await axios({
      method: "POST",
      url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        status: "read",
        message_id: message.id,
      },
    });
}catch(err){
    console.log("me",err)
}
  }else{
    
  try{
    const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];

    const business_phone_number_id =
    req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;
  
    const res2= await axios({
        method: "POST",
        url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          to: message.from,
          text: { body: "Was there anything we could have done to improve your experience?" },
        context: {
          message_id: message.id, // shows the message as a reply to the original user message
        },
        },
      });
      console.log("res3",res2.status)
  }catch(err){
    console.log("res3",err)
  }
  try{
    const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];

    const business_phone_number_id =
    req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;
  
    const res2= await axios({
        method: "POST",
        url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          to: message.from,
          text: { body: "What could we do to make your experience ten times better?" },
        context: {
          message_id: message.id, // shows the message as a reply to the original user message
        },
        },
      });
      console.log("res4",res2.status)
  }catch(err){
    console.log("res4",err)
  }
  }

  res.sendStatus(200);
});

// accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // check the mode and token sent are correct
  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    // respond with 200 OK and challenge token from the request
    res.status(200).send(challenge);
    console.log("Webhook verified successfully!");
  } else {
    // respond with '403 Forbidden' if verify tokens do not match
    res.sendStatus(403);
  }
});

app.get("/", (req, res) => {
  res.send(`<pre>Nothing to see here.
Checkout README.md to start.</pre>`);
});
app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
