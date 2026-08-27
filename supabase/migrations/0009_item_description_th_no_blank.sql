-- 0009_item_description_th_no_blank.sql
--
-- An empty translation is not a translation, and it is the worst kind of wrong
-- this feature can be: `thai_line = ''` renders a blank line where an English
-- effect used to be, and `thai_term = ''` renders `" : Card"`. Nothing errors,
-- nothing logs, and the reader simply never learns what the item does. A
-- missing translation is visible (English shows); an empty one is invisible.
--
-- NULL keeps its meaning in the terms table and is explicitly still allowed:
-- a row with a NULL thai_term means "considered, and the glossary says this
-- term stays English", which is a decision. A row with '' means nothing at all.
-- Collapsing the two is exactly what these constraints prevent.
--
-- thai_line is already NOT NULL, so it only needs the blank check.

alter table item_description_lines
  add constraint item_description_lines_thai_line_not_blank
  check (length(btrim(thai_line)) > 0);

alter table item_description_terms
  add constraint item_description_terms_thai_term_not_blank
  check (thai_term is null or length(btrim(thai_term)) > 0);
