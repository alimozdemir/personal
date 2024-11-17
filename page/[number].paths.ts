import fs from 'fs/promises';
import path from 'path';
import { NUMBER_OF_ARTICLES_PER_PAGE } from '../consts';

export default {
    async paths() {
      const dirPath = path.resolve(__dirname, '../posts/')
      const dir = await fs.readdir(dirPath)
      const totalCount = dir.length;
      const pageCount =  Math.ceil(totalCount / NUMBER_OF_ARTICLES_PER_PAGE);

      return Array.from({ length: pageCount }).map((_, index) => {
        return {
          params: {
            number: (index + 1).toString()
          }
        }
      })
    }
    
  }