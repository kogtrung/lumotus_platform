package com.backend.lumotus.service;

import com.backend.lumotus.exception.BadRequestException;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

final class CsvDeckImporter {

    private static final int MAX_ROWS = 500;

    private CsvDeckImporter() {}

    record ImportRow(
            String front,
            String back,
            String phonetic,
            String partOfSpeech,
            String example,
            String hint,
            String imageUrl,
            String icon) {}

    record ParseResult(List<ImportRow> rows, List<String> errors) {}

    static ParseResult parse(InputStream input) {
        List<ImportRow> rows = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try (CSVReader reader = new CSVReader(new InputStreamReader(input, StandardCharsets.UTF_8))) {
            String[] headerRow = reader.readNext();
            if (headerRow == null || headerRow.length == 0) {
                throw new BadRequestException("CSV file is empty");
            }

            String[] cleanedHeaderRow = stripBom(headerRow);
            Map<String, Integer> headerIndex = mapHeaders(cleanedHeaderRow);
            if (!headerIndex.containsKey("front") || !headerIndex.containsKey("back")) {
                String foundHeaders = String.join(", ", java.util.Arrays.stream(cleanedHeaderRow)
                        .filter(h -> h != null && !h.trim().isEmpty())
                        .map(h -> "\"" + h.trim() + "\"")
                        .toList());
                throw new BadRequestException("CSV must include columns: front, back. Found headers: " + foundHeaders);
            }

            String[] line;
            int lineNo = 1;
            while ((line = reader.readNext()) != null) {
                lineNo++;
                if (rows.size() >= MAX_ROWS) {
                    errors.add("Stopped at row " + lineNo + ": max " + MAX_ROWS + " cards per import");
                    break;
                }
                if (isBlankLine(line)) {
                    continue;
                }

                String front = cell(line, headerIndex.get("front"));
                String back = cell(line, headerIndex.get("back"));
                if (front.isBlank() || back.isBlank()) {
                    errors.add("Row " + lineNo + ": front and back are required — skipped");
                    continue;
                }
                if (front.length() > 1000 || back.length() > 1000) {
                    errors.add("Row " + lineNo + ": front/back exceeds 1000 chars — skipped");
                    continue;
                }

                rows.add(new ImportRow(
                        front.trim(),
                        back.trim(),
                        optionalCell(line, headerIndex, "phonetic"),
                        optionalCell(line, headerIndex, "part_of_speech"),
                        optionalCell(line, headerIndex, "example"),
                        optionalCell(line, headerIndex, "hint"),
                        optionalCell(line, headerIndex, "image_url"),
                        optionalCell(line, headerIndex, "icon")));
            }
        } catch (IOException | CsvException ex) {
            throw new BadRequestException("Invalid CSV file: " + ex.getMessage());
        }

        if (rows.isEmpty() && errors.isEmpty()) {
            throw new BadRequestException("No valid card rows found in CSV");
        }

        return new ParseResult(rows, errors);
    }

    /** Trùng front trong cùng file — giữ dòng xuất hiện sau. */
    static List<ImportRow> dedupeByFront(List<ImportRow> rows) {
        LinkedHashMap<String, ImportRow> map = new LinkedHashMap<>();
        for (ImportRow row : rows) {
            map.put(normalizeFrontKey(row.front()), row);
        }
        return new ArrayList<>(map.values());
    }

    static String normalizeFrontKey(String front) {
        return front.trim().toLowerCase(Locale.ROOT);
    }

    private static Map<String, Integer> mapHeaders(String[] headerRow) {
        Map<String, Integer> index = new HashMap<>();
        for (int i = 0; i < headerRow.length; i++) {
            String key = normalizeHeader(headerRow[i]);
            if (!key.isEmpty()) {
                index.putIfAbsent(key, i);
            }
        }
        return index;
    }

    private static String normalizeHeader(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.trim().toLowerCase(Locale.ROOT).replace(' ', '_');
    }

    private static String[] stripBom(String[] headers) {
        if (headers == null || headers.length == 0) {
            return headers;
        }
        String[] cleaned = new String[headers.length];
        for (int i = 0; i < headers.length; i++) {
            String value = headers[i];
            if (value != null && value.startsWith("\uFEFF")) {
                value = value.substring(1);
            }
            cleaned[i] = value;
        }
        return cleaned;
    }

    private static boolean isBlankLine(String[] line) {
        for (String cell : line) {
            if (cell != null && !cell.isBlank()) {
                return false;
            }
        }
        return true;
    }

    private static String cell(String[] line, int index) {
        if (index < 0 || index >= line.length || line[index] == null) {
            return "";
        }
        return line[index].trim();
    }

    private static String optionalCell(String[] line, Map<String, Integer> headerIndex, String name) {
        Integer idx = headerIndex.get(name);
        if (idx == null) {
            return null;
        }
        String value = cell(line, idx);
        return value.isBlank() ? null : value;
    }
}
