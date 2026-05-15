// Database adapter interface - implement for your DB driver

export interface QueryResultRow {
  [key: string]: unknown;
}

export interface QueryResult<T = QueryResultRow> {
  rows: T[];
  rowCount: number;
}

export interface DbTransaction {
  query<T = QueryResultRow>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
}

export interface DbAdapter extends DbTransaction {
  transaction<T>(fn: (tx: DbTransaction) => Promise<T>): Promise<T>;
}