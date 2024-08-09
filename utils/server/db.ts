import { bookListStatus, crawleeStatus } from './../../constant';
import { Low } from 'lowdb/lib/core/Low';
import { JSONFilePreset } from 'lowdb/node';

export type TaskListData = {
  name: string;
  databaseId: string;
  createdAt: Date;
  status: string;
};
export type TaskListDBData = {
  list: TaskListData[];
};
export type BookListData = {
  id: string;
  name: string;
  link: string;
  createdAt: Date;
  isFetched: boolean;
  lastFetchedAt?: Date | null;
  douban_book_id: string;
  status: string;
};

export type BookListDBData = {
  list: BookListData[];
};
export type ImportCacheDBData = {
  [id: string]: string[];
};
export type ImportLogsDBData = {
  [id: string]: string[];
};

export type CrawleeInfoDBData = {
  status: string;
  runningFor: Partial<BookListData> | null;
};
const defaultBookListDBData: BookListDBData = {
  list: [],
};
const defaultTaskListDBData: TaskListDBData = {
  list: [],
};
const defaultCrawleeInfoDBData: CrawleeInfoDBData = {
  status: crawleeStatus.NORMAL,
  runningFor: null,
};
const defaultImportCacheDBData: ImportCacheDBData = {};
const defaultImportLogsDBData: ImportLogsDBData = {};
let bookListDBClient: Low<BookListDBData> | null = null;
let taskListDBClient: Low<TaskListDBData> | null = null;
let crawleeInfoDBClient: Low<CrawleeInfoDBData> | null = null;
let importCacheDBClient: Low<ImportCacheDBData> | null = null;
let importLogsDBClient: Low<ImportLogsDBData> | null = null;

export async function getImportLogsDBClient() {
  if (!importLogsDBClient) {
    importLogsDBClient = await JSONFilePreset<ImportLogsDBData>(
      './db/importLogsDB.json',
      defaultImportLogsDBData
    );
  }
  return importLogsDBClient;
}
export async function getImportCacheDBClient() {
  if (!importCacheDBClient) {
    importCacheDBClient = await JSONFilePreset<ImportCacheDBData>(
      './db/importCacheDB.json',
      defaultImportCacheDBData
    );
  }
  return importCacheDBClient;
}
export async function getCrawleeStatusDBClient() {
  if (!crawleeInfoDBClient) {
    crawleeInfoDBClient = await JSONFilePreset<CrawleeInfoDBData>(
      './db/crawleeInfoDB.json',
      defaultCrawleeInfoDBData
    );
  }
  return crawleeInfoDBClient;
}

export async function getBookListDBClient() {
  if (!bookListDBClient) {
    bookListDBClient = await JSONFilePreset<BookListDBData>(
      './db/bookListDB.json',
      defaultBookListDBData
    );
  }
  return bookListDBClient;
}

export async function getTaskListDBClient() {
  if (!taskListDBClient) {
    taskListDBClient = await JSONFilePreset<TaskListDBData>(
      './db/taskListDB.json',
      defaultTaskListDBData
    );
  }
  return taskListDBClient;
}
