import { Discord, On, Client, ArgsOf } from "@typeit/discord";
import { analyzeImage, analyzeText } from "./analyze";
import { db } from "./firebase";
import { FieldValue } from "@google-cloud/firestore";

@Discord()
export class Bot {
  private static _client: Client;

  static start() {
    console.log("start");

    this._client = new Client();
    this._client.login(process.env.DISCORD_TOKEN);
  }

  @On("message")
  public async onMessage([message]: ArgsOf<"message">) {
    let messageId = message.id;
    let caption: string = message.content;
    let authorId: string = message.author.id;
    let attachments: string[] = message.attachments.map((val) => val.url);
    let time: Date = message.createdAt;

    for (let attachment of attachments) {
      console.log("analyzing image: " + attachment);

      let labels: string[];
      let text: string;
      // analyze image
      let res: { label: string; value: number }[] = await analyzeImage(
        attachment
      );
      labels = res.filter((r) => r.value > 0.9).map((r) => r.label);
      // run text analysis if its a document
      if (
        labels.includes("text") ||
        labels.includes("internet") ||
        labels.includes("vector") ||
        labels.includes("document")
      ) {
        text = await analyzeText(attachment);
      }
      // save result
      await db.collection("images").add({
        messageId: messageId,
        authorId: authorId,
        caption: caption,
        time: time,
        url: attachment,
        labels: labels,
        ...(text && { text: text }),
      });
      // save stats
      res.forEach(({ label }) => {
        const ref = db.collection("stats").doc("labels");
        let obj = {};
        obj[label] = FieldValue.increment(1);
        return ref.set(obj, { merge: true });
      });
    }
  }

  // FIXME doesent work on messages with images.
  // @On("messageDelete")
  // public async onMessageDelete([message]: ArgsOf<"message">) {
  //   // delete attachments
  //   console.log(message);
  //   const docs = await db
  //     .collection("images")
  //     .where("messageId", "==", message.id)
  //     .get();
  //   docs.forEach((doc) => {
  //     console.log(doc.data());
  //     doc.ref.delete();
  //   });
  // }
}
