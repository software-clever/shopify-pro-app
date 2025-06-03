import { ClientBase, Pool, QueryResult, QueryResultRow } from "pg";
import FileContentReader from "app/infrastructure/FileContentReader";
import { assertColumns } from "app/utils/queryShapeAssert";

type PgQueryable = Pool | ClientBase;

export class QueryExecutor {
  constructor(
    private readonly db: PgQueryable,
    private readonly reader: FileContentReader,
  ) {}
  /**
   * Executes a query by its name, reading the SQL text from a file.
   * If the file is empty or not found, it returns an empty result set.
   *
   * @param name - The name of the query to execute.
   * @param values - Optional parameters to pass to the query.
   * @returns A promise that resolves to the query result.
   */
  public async queryByName(
    name: string,
    values?: unknown[],
  ): Promise<QueryResult>;
  /**
   * Executes a query by its name, reading the SQL text from a file.
   * If the file is empty or not found, it returns an empty result set.
   *
   * @template R - The type of the rows in the query result.
   * @param name - The name of the query to execute.
   * @param values - Optional parameters to pass to the query.
   * @returns A promise that resolves to the query result.
   */
  public async queryByName<R extends QueryResultRow>(
    name: string,
    values?: unknown[],
  ): Promise<QueryResult<R>>;
  /**
   * Executes a query by its name, reading the SQL text from a file.
   * If the file is empty or not found, it returns an empty result set.
   *
   * @param name - The name of the query to execute.
   * @param values - Optional parameters to pass to the query.
   * @returns A promise that resolves to the query result.
   */
  public async queryByName(
    name: string,
    values?: unknown[],
  ): Promise<QueryResult<QueryResultRow>> {
    const text = (await this.reader.read(name)) ?? "";
    if (!text) {
      return {
        oid: 0,
        command: "",
        rowCount: 0,
        rows: [],
        fields: [],
      };
    }
    const result = await this.db.query({ name, text, values });
    assertColumns(name, result);
    return result;
  }
}
