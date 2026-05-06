import { describe, expect, it } from 'vitest';
import { compileCadMarkup } from '../../src/core';
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

    it('keeps unit-aware dimensions deterministic', () => {
        const graph = compileCadMarkup(`<scene id="root"><house id="house" width="8m" depth="650cm" height="4.8m" /></scene>`).graph;
        expect(graph.components[0]?.size).toEqual({
            width: 8000,
            depth: 6500,
            height: 4800
        });
    });
});
