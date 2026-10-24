import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const athleteState=sqliteTable('athlete_state',{ownerId:text('owner_id').primaryKey(),payload:text('payload').notNull(),revision:integer('revision').notNull().default(1),updatedAt:integer('updated_at').notNull()});
