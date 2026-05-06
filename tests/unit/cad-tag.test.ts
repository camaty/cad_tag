import { describe, expect, it } from 'vitest';
import { compileCadMarkup } from '../../src/core';
import { buildExportPayload } from '../../src/export';
import { parseCadMarkup } from '../../src/core/tag-schema';

describe('cad tag parsing', () => {
    it('parses a supported scene with all requested tags', () => {
        const graph = compileCadMarkup(`<scene id="root">
            <bookshelf id="a" />
            <bed id="b" />
            <desk id="c" />
            <table id="d" />
            <chair id="e" />
            <cabinet id="f" />
            <shelf id="g" />
            <sofa id="h" />
            <stand-lamp id="i" />
            <house id="j" />
            <building id="k" />
            <skyscraper id="l" />
        </scene>`).graph;

        expect(graph.components).toHaveLength(12);
        expect(new Set(graph.components.map((component) => component.tag))).toEqual(
            new Set([
                'bookshelf',
                'bed',
                'desk',
                'table',
                'chair',
                'cabinet',
                'shelf',
                'sofa',
                'stand-lamp',
                'house',
                'building',
                'skyscraper'
            ])
        );
    });

    it('rejects duplicate ids', () => {
        expect(() =>
            parseCadMarkup(`<scene id="root"><chair id="dup" /><table id="dup" /></scene>`)
        ).toThrow(/Duplicate id/);
    });

    it('rejects unsupported tags and malformed roots', () => {
        expect(() => parseCadMarkup('<chair id="c" />')).toThrow(/root CAD tag must be <scene>/);
        expect(() => parseCadMarkup('<scene id="r"><window id="w" /></scene>')).toThrow(/Unsupported tag/);
    });

    it('rejects illegal nesting and bad dimensions', () => {
        expect(() =>
            parseCadMarkup('<scene id="r"><bookshelf id="b"><chair id="c" /></bookshelf></scene>')
        ).toThrow(/cannot contain child tags/);

        expect(() =>
            parseCadMarkup('<scene id="r"><chair id="c" width="5ft" /></scene>')
        ).toThrow(/Unsupported dimension format/);
    });

    it('keeps unit-aware dimensions deterministic', () => {
        const graph = compileCadMarkup(`<scene id="root"><house id="house" width="8m" depth="650cm" height="4.8m" /></scene>`).graph;
        expect(graph.components[0]?.size).toEqual({
            width: 8000,
            depth: 6500,
            height: 4800
        });
    });

    it('keeps group offsets and export payload deterministic', () => {
        const graph = compileCadMarkup(`<scene id="root"><group id="g" x="2m" z="1m"><desk id="desk" /></group></scene>`).graph;
        expect(graph.components[0]?.position.x).toBe(2000);
        expect(graph.components[0]?.position.z).toBe(1000);

        const payload = buildExportPayload(graph);
        expect(payload.components[0]?.partCount).toBe(graph.components[0]?.parts.length);
        expect(payload.components[0]?.dimensionsMm.width).toBe(graph.components[0]?.size.width);
    });
});
