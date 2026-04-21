-- Eski FK ni o'chirish (coordinators jadvaliga ishora qilgan)
ALTER TABLE public.checklist_reviews
  DROP CONSTRAINT IF EXISTS checklist_reviews_reviewed_by_coordinator_id_fkey;

-- Endi koordinator = staff bo'lgani uchun FK ni staff jadvaliga bog'laymiz
ALTER TABLE public.checklist_reviews
  ADD CONSTRAINT checklist_reviews_reviewed_by_coordinator_id_fkey
  FOREIGN KEY (reviewed_by_coordinator_id)
  REFERENCES public.staff(id)
  ON DELETE SET NULL;

-- Endi keraksiz coordinators jadvalini o'chiramiz
DROP TABLE IF EXISTS public.coordinators;