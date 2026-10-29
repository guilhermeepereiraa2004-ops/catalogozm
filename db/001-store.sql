-- Loja pequena: estado versionado em JSONB e atualização atômica por revisão.
-- Um único CAS cobre pedido + reserva de estoque + idempotência.
CREATE TABLE IF NOT EXISTS public.store_state (
 id integer PRIMARY KEY CHECK(id=1),
 revision bigint NOT NULL DEFAULT 0,
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object'),
 updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON TABLE public.store_state FROM PUBLIC;
CREATE OR REPLACE FUNCTION public.read_store() RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT jsonb_build_object('revision',revision,'state',data) FROM public.store_state WHERE id=1
$$;
CREATE OR REPLACE FUNCTION public.commit_store(expected bigint, next_state jsonb) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE changed integer;
BEGIN
 IF jsonb_typeof(next_state->'products') <> 'array' OR jsonb_typeof(next_state->'orders') <> 'array' OR jsonb_typeof(next_state->'expenses') <> 'array' THEN RAISE EXCEPTION 'Estado inválido'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(next_state->'products') p WHERE (p->>'stock')::integer < 0 OR (p->>'price')::bigint <= 0) THEN RAISE EXCEPTION 'Estoque ou preço inválido'; END IF;
 UPDATE public.store_state SET data=next_state, revision=revision+1, updated_at=now() WHERE id=1 AND revision=expected;
 GET DIAGNOSTICS changed=ROW_COUNT;
 RETURN changed=1;
END $$;
REVOKE ALL ON FUNCTION public.read_store() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.commit_store(bigint,jsonb) FROM PUBLIC;
