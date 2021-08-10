import { Discord, On, Client, ArgsOf } from "@typeit/discord";
import { analyzeImage } from "./analyze";
import { db } from "./firebase";

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
      let labels = {};
      let res: { label: string; value: number }[] = await analyzeImage(
        attachment
      );
      res.forEach(({ label, value }) => (labels[label] = value));
      // save result
      await db.collection("images").add({
        authorId: authorId,
        caption: caption,
        time: time,
        url: attachment,
        labels: labels,
      });
    }
  }
}
