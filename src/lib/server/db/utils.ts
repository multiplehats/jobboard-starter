import { type Column, getTableColumns, type SQL, sql } from 'drizzle-orm';
import type { PgTable, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { getTableConfig } from 'drizzle-orm/pg-core';

// ============================================================================
// Conflict Resolution Utilities
// ============================================================================

/**
 * Creates an update set for all columns in a table for use in conflict resolution.
 * Uses COALESCE to handle NULL values appropriately.
 *
 * @param table - The table to create the update set for
 * @returns An object containing the update set for all columns
 */
export function conflictUpdateSetAllColumns<TTable extends PgTable>(
	table: TTable
): PgUpdateSetSource<TTable> {
	const columns = getTableColumns(table);
	const { name: tableName } = getTableConfig(table);
	const conflictUpdateSet = Object.entries(columns).reduce(
		(acc: Record<string, SQL>, [columnName, columnInfo]) => {
			if (!columnInfo.default) {
				acc[columnName] = sql.raw(
					`COALESCE(excluded.${columnInfo.name}, ${tableName}.${columnInfo.name})`
				);
			}
			return acc;
		},
		{}
	) as PgUpdateSetSource<TTable>;
	return conflictUpdateSet;
}

/**
 * Creates an update set for specified columns in a table for use in conflict resolution.
 *
 * @param table - The table to create the update set for
 * @param columns - Array of column names to include in the update set
 * @returns An object containing the update set for specified columns
 */
export function conflictUpdateSet<TTable extends PgTable>(
	table: TTable,
	columns: (keyof TTable['_']['columns'] & keyof TTable)[]
): PgUpdateSetSource<TTable> {
	return Object.assign(
		{},
		...columns.map((k) => ({
			[k]: sql.raw(`excluded.${(table[k] as Column).name}`)
		}))
	) as PgUpdateSetSource<TTable>;
}

// ============================================================================
// Pagination Utilities
// ============================================================================

/** Default number of items per page */
export const DEFAULT_PAGE_SIZE = 20;

/** Parameters for paginated queries */
export type PaginationParams = {
	/** Page number (1-based) */
	page?: number;
	/** Number of items per page */
	limit?: number;
};

/** Structure of a paginated query result */
export type PaginatedQueryResult<T> = {
	/** Array of items for the current page */
	items: T[];
	/** Pagination metadata */
	metadata: {
		/** Total number of items across all pages */
		total: number;
		/** Current page number */
		page: number;
		/** Number of items per page */
		limit: number;
		/** Total number of pages */
		totalPages: number;
		/** Whether there is a next page */
		hasNextPage: boolean;
		/** Whether there is a previous page */
		hasPreviousPage: boolean;
	};
};

/**
 * Builds a paginated query result from a query and count query.
 *
 * @param query - The query to execute for fetching items
 * @param countQuery - The query to execute for counting total items
 * @param params - Pagination parameters
 * @returns A paginated query result
 */
export async function buildPaginatedQuery<T>(
	query: { execute: () => Promise<T[]> },
	countQuery: { execute: () => Promise<Array<{ count: number | string }>> },
	{ page = 1, limit = DEFAULT_PAGE_SIZE }: PaginationParams = {}
): Promise<PaginatedQueryResult<T>> {
	const [items, [countResult]] = await Promise.all([query.execute(), countQuery.execute()]);

	const totalCount = Number(countResult?.count ?? 0);
	const totalPages = Math.ceil(totalCount / limit);

	return {
		items,
		metadata: {
			total: totalCount,
			page,
			limit,
			totalPages,
			hasNextPage: page < totalPages,
			hasPreviousPage: page > 1
		}
	};
}
