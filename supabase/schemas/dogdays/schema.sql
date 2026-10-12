CREATE SCHEMA "dogdays";

-- Signed-out visitors never reach the database (DogDays keeps their plans in
-- the browser), so `anon` gets no access to this schema at all.
GRANT USAGE ON SCHEMA "dogdays" TO "authenticated", "service_role";

GRANT CREATE, USAGE ON SCHEMA "dogdays" TO "postgres";
