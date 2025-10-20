import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { PrismaClient } from '@prisma/client';

async function getTables(prisma) {
    const schemas = ['public'];

    let allTables = [];

    for (const schema of schemas) {
        try {
            const tables = await prisma.$queryRawUnsafe(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${schema}' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
            allTables = allTables.concat(
                tables.map((t) => ({
                    name: t.table_name,
                    schema
                }))
            );
        } catch (e) {
            console.log(`Could not query schema ${schema}:`, e.message);
        }
    }

    return allTables;
}

async function exportTableRaw(prisma, tableName, schema = 'public') {
    try {
        // Check if table has data
        const countQuery = `SELECT COUNT(*) as count FROM "${schema}"."${tableName}"`;
        const countResult = await prisma.$queryRawUnsafe(countQuery);
        const count = parseInt(countResult[0].count);

        if (count === 0) {
            return null;
        }

        console.log(`  📊 Found ${count} rows in ${tableName}`);

        // Get column names with proper casing
        const columnsQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_schema = '${schema}' AND table_name = '${tableName}'
      ORDER BY ordinal_position
    `;
        const columnsResult = await prisma.$queryRawUnsafe(columnsQuery);

        if (columnsResult.length === 0) {
            console.log(`  ⚠️ No columns found for ${tableName}`);
            return null;
        }

        const columns = columnsResult.map((c) => ({
            name: c.column_name,
            type: c.data_type
        }));

        // Build SELECT query with proper quoting
        const columnNames = columns.map((col) => `"${col.name}"`).join(', ');
        const selectQuery = `SELECT ${columnNames} FROM "${schema}"."${tableName}"`;

        console.log(`  🔍 Query: ${selectQuery.substring(0, 100)}...`);

        // Get all data
        const data = await prisma.$queryRawUnsafe(selectQuery);

        if (data.length === 0) {
            return null;
        }

        // Generate CSV with proper headers
        const headers = columns.map((col) => col.name);
        let csv = headers.join(',') + '\n';

        for (const row of data) {
            const values = columns.map((col) => {
                let val = row[col.name];

                if (val === null || val === undefined) {
                    return '';
                }

                let strVal;

                // Handle different data types
                switch (col.type) {
                    case 'timestamp without time zone':
                    case 'timestamp with time zone':
                    case 'date':
                    case 'time without time zone':
                    case 'time with time zone':
                        strVal =
                            val instanceof Date
                                ? val.toISOString()
                                : String(val);
                        break;
                    case 'boolean':
                        strVal = val ? 'true' : 'false';
                        break;
                    case 'json':
                    case 'jsonb':
                        strVal =
                            typeof val === 'object'
                                ? JSON.stringify(val)
                                : String(val);
                        break;
                    default:
                        strVal = String(val);
                }

                // CSV escape
                strVal = strVal.replace(/"/g, '""');
                if (
                    strVal.includes(',') ||
                    strVal.includes('\n') ||
                    strVal.includes('"')
                ) {
                    strVal = `"${strVal}"`;
                }

                return strVal;
            });

            csv += values.join(',') + '\n';
        }

        console.log(`  ✅ Exported ${data.length} rows`);
        return {
            name: `${tableName}.csv`,
            content: csv,
            rowCount: data.length
        };
    } catch (error) {
        console.log(`  ❌ Error exporting ${tableName}: ${error.message}`);
        return null;
    }
}

async function main() {
    const prisma = new PrismaClient();

    try {
        console.log('🔍 Discovering tables...');
        const tables = await getTables(prisma);
        console.log(
            `📋 Found ${tables.length} tables:`,
            tables.map((t) => t.name)
        );

        if (tables.length === 0) {
            console.log(
                'No tables found. Check your database connection and schema.'
            );
            return;
        }

        const csvs = [];

        for (const { name, schema } of tables) {
            console.log(`\n📂 Processing table: ${name}`);
            const csv = await exportTableRaw(prisma, name, schema);
            if (csv) {
                csvs.push(csv);
            }
        }

        await prisma.$disconnect();

        if (csvs.length === 0) {
            console.log('\n❌ No data found in any tables');
            return;
        }

        const outputDir = process.cwd();

        console.log(
            `\n📊 Summary: ${csvs.length} tables exported with ${csvs.reduce((sum, c) => sum + c.rowCount, 0)} total rows`
        );

        if (csvs.length === 1) {
            const csvPath = path.join(outputDir, csvs[0].name);
            fs.writeFileSync(csvPath, csvs[0].content);
            console.log(`\n📁 Single CSV exported: ${csvPath}`);
        } else {
            const timestamp = new Date().toISOString().split('T')[0];
            const zipPath = path.join(
                outputDir,
                `prisma-export-${timestamp}.zip`
            );
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => {
                console.log(
                    `\n📦 ZIP created: ${zipPath} (${archive.pointer()} bytes)`
                );
            });

            archive.pipe(output);

            for (const csv of csvs) {
                archive.append(csv.content, { name: csv.name });
            }

            archive.finalize();

            await new Promise((resolve) => output.on('close', resolve));
        }
    } catch (error) {
        console.error('💥 Fatal error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((e) => {
    console.error('💥 Fatal error:', e);
    process.exit(1);
});
