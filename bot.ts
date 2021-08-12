import { Discord, On, Client, ArgsOf } from "@typeit/discord";
import { analyzeImage } from "./analyze";
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
    let caption: string = message.content;
    let authorId: string = message.author.id;
    let attachments: string[] = message.attachments.map((val) => val.url);
    let time: Date = message.createdAt;

    for (let attachment of attachments) {
      // analyze image
      console.log("analyzing image: " + attachment);
      let res: { label: string; value: number }[] = await analyzeImage(
        attachment
      );
      let labels = {};
      res.forEach(({ label, value }) => (labels[label] = value));
      // save result
      await db.collection("images").add({
        _authorId: authorId,
        _caption: caption,
        _time: time,
        _url: attachment,
        ...labels,
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
}
