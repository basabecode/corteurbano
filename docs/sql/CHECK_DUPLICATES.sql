-- Verificar servicios duplicados
SELECT name, count(*) 
FROM public.services 
GROUP BY name 
HAVING count(*) > 1;

-- Ver todos los servicios
SELECT * FROM public.services ORDER BY name;
