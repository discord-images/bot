import { grpc } from "clarifai-nodejs-grpc";
import service = require("clarifai-nodejs-grpc/proto/clarifai/api/service_pb");
import resources = require("clarifai-nodejs-grpc/proto/clarifai/api/resources_pb");
import { StatusCode } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";
import { V2Client } from "clarifai-nodejs-grpc/proto/clarifai/api/service_grpc_pb";

const clarifai = new V2Client(
  "api.clarifai.com",
  grpc.ChannelCredentials.createSsl()
);
const metadata = new grpc.Metadata();
metadata.set("authorization", `Key ${process.env.CLARIFAI_API_KEY}`);

export function analyzeImage(
  url: string
): Promise<{ label: string; value: number }[]> {
  const request = new service.PostModelOutputsRequest();
  request.setModelId("aaa03c23b3724a16a56b629203edc62c");
  request.addInputs(
    new resources.Input().setData(
      new resources.Data().setImage(new resources.Image().setUrl(url))
    )
  );

  return new Promise<{ label: string; value: number }[]>((resolve, reject) => {
    clarifai.postModelOutputs(request, metadata, (error, response) => {
      if (error) {
        reject(error.message);
      }

      if (response.getStatus().getCode() !== StatusCode.SUCCESS) {
        reject();
      }

      let res: { label: string; value: number }[] = response
        .getOutputsList()[0]
        .getData()
        .getConceptsList()
        .map((r) => {
          return { label: r.getName(), value: r.getValue() };
        });
      resolve(res);
    });
  });
}

export function analyzeText(url: string): Promise<string> {
  // FIXME 2 possible models:
  // https://www.clarifai.com/models/ocr-scene
  // https://www.clarifai.com/models/optical-character-recognition-analysis

  const request = new service.PostModelOutputsRequest();
  request.setModelId("f1b1005c8feaa8d3f34d35f224092915");
  request.addInputs(
    new resources.Input().setData(
      new resources.Data().setImage(new resources.Image().setUrl(url))
    )
  );

  return new Promise<string>((resolve, reject) => {
    clarifai.postModelOutputs(request, metadata, (error, response) => {
      if (error) {
        reject(error.message);
      }

      if (response.getStatus().getCode() !== StatusCode.SUCCESS) {
        reject();
      }

      let res = response
        .getOutputsList()[0]
        .getData()
        .getRegionsList()
        .map((x) => x.getData().getText().getRaw().toString());
      resolve(res.join(" "));
    });
  });
}
