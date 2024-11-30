import { restore } from "./restoreUtil";
import StorageUtil from "../serviceUtils/storageUtil";
import {AuthType, createClient} from 'webdav'
class WebdavUtil {
  static UploadFile = async (blob: any) => {
    return new Promise<boolean>(async (resolve, reject) => {
      let { url, username, password } = JSON.parse(
        StorageUtil.getReaderConfig("webdav_token") || "{}"
      );
      const client = createClient(url, {username, password, authType: AuthType.Password})
      if ((await client.exists("/KoodoReader")) === false) {
        await client.createDirectory("/KoodoReader");
      }
      await client.putFileContents('/KoodoReader/data.zip', await blob.arrayBuffer(), {overwrite: true})
      resolve(true)
    });
  };
  static DownloadFile = async () => {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        let { url, username, password } = JSON.parse(
          StorageUtil.getReaderConfig("webdav_token") || "{}"
        );
        const client = createClient(url, {username, password, authType: AuthType.Password})
        
        if ((await client.exists("/KoodoReader/data.zip")) === false) {
          resolve(false);
          return;
        }

        const buffer = await client.getFileContents("/KoodoReader/data.zip", { format: 'binary' }) as Buffer;
        let blobTemp = new Blob([buffer], { type: "application/zip" });
        let fileTemp = new File([blobTemp], "data.zip", {
          lastModified: new Date().getTime(),
          type: blobTemp.type,
        });
        
        let result = await restore(fileTemp);
        resolve(result);
      } catch (error) {
        console.error("Webdav download error:", error);
        resolve(false);
      }
    });
  };
}

export default WebdavUtil;
