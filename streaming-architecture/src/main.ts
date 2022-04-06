import { readdir, readFile, writeFile, existsSync, mkdirSync }  from 'fs';
import path from 'path'
import { Constants } from './constants';

export class Main {
  // Declare variables
  private total = 0
  private emails = []
  public uniqueEmails = []

  // Get directory location
  getDirectory(): string {
    return Constants.SOURCE
  }

  // Load files from directory
  async getFiles(): Promise<string[]> {
    return await new Promise<string[]>(resolve => {
      readdir(path.join(__dirname, `../${this.getDirectory()}`), (err, files) => {
        if (err) throw err;
        resolve(files)
      })
    }).then(files => {
      return files
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Consume loaded files
  async consume(): Promise<any> {
    const files = await this.getFiles()
    return await Promise.all(files.map(async file => {
      return await new Promise(resolve => {
        readFile(`${Constants.SOURCE}/${file}`, function(err, data){
          if (err) throw err;
          const output = JSON.parse(data.toString())
          resolve(output)
        });
      }).then(output => {
        return output
    })
  }))
 }

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 // Transform into desired output format
 async transform(): Promise<any> {
  const rawData = await this.consume()

  rawData.forEach(data => {
    data.logs.forEach(log => {
        this.emails.push({
          email: log.email,
          total: this.total
        }
      )

      this.emails.forEach(item => {
        if(item.email === log.email) {
          item.total += 1
        }
      })
    })

    this.emails = this.emails.filter((value, index, self) =>
      index === self.findIndex((t) => (t.email === value.email))
    )

    const processedData = {
      "logs_id": data.id,
      "tally": this.emails
    }

    this.uniqueEmails = [...this.uniqueEmails, processedData]
  })
  return this.uniqueEmails
 }

 async produce(): Promise<void> {
   const transformedFiles = await this.transform()
   transformedFiles.forEach((file, index) => {
      if (!existsSync(`${Constants.DESTINATION}`)){
          mkdirSync(`${Constants.DESTINATION}`);
      }
      writeFile(`${Constants.DESTINATION}/logs_${index}.json`, Buffer.from(JSON.stringify(file), "utf-8"), (err) => {
         if (err) throw err;
         console.log(`logs_${index}.json written successfully\n`);
      });
   })
 }
}
