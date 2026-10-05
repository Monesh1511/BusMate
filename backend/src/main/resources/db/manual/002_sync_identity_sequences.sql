DO $$
DECLARE
    identity_column record;
    maximum_id bigint;
    current_value bigint;
    sequence_is_called boolean;
BEGIN
    FOR identity_column IN
        SELECT
            table_schema,
            table_name,
            column_name,
            pg_get_serial_sequence(
                format('%I.%I', table_schema, table_name),
                column_name
            ) AS sequence_name
        FROM information_schema.columns
        WHERE table_schema = 'busgo_demo'
          AND is_identity = 'YES'
    LOOP
        EXECUTE format(
            'SELECT MAX(%I) FROM %I.%I',
            identity_column.column_name,
            identity_column.table_schema,
            identity_column.table_name
        ) INTO maximum_id;

        IF maximum_id IS NOT NULL THEN
            EXECUTE format('SELECT last_value, is_called FROM %s', identity_column.sequence_name)
                INTO current_value, sequence_is_called;

            IF current_value < maximum_id
               OR (current_value = maximum_id AND NOT sequence_is_called) THEN
                PERFORM setval(identity_column.sequence_name::regclass, maximum_id, true);
            END IF;
        END IF;
    END LOOP;
END
$$;
