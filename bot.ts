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
    // if (!message.attachments) return;
    // console.log(message);

    let caption: string = message.content;
    let authorId: string = message.author.id;
    let attachments: string[] = message.attachments.map((val) => val.url);
    let time: Date = message.createdAt;

    for (let attachment of attachments) {
      // analyze image
      // let res = analyzeImage(attachment);
      // console.log(res);
      // save result
      await db.collection("images").add({
        authorId: authorId,
        caption: caption,
        time: time,
        url: attachment,
        labels: {
          nature: 0.4567,
          tree: 0.86,
        },
      });
    }
  }
}
