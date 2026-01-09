/**
 * Document Component System - YAML Parser
 *
 * _components.yaml の読み込み・書き込み・検証
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse, stringify } from 'yaml';
import type { ComponentMap, ComponentDefinition, Component, ValidationResult, ValidationError } from './types.js';

/**
 * _components.yaml を読み込む
 */
export function loadComponentMap(filePath: string): ComponentMap {
  if (!existsSync(filePath)) {
    throw new Error(`Component map not found: ${filePath}`);
  }

  const content = readFileSync(filePath, 'utf-8');
  const data = parse(content) as ComponentMap;

  if (!data || typeof data !== 'object') {
    throw new Error(`Invalid component map format: ${filePath}`);
  }

  return data;
}

/**
 * _components.yaml に書き込む
 */
export function saveComponentMap(filePath: string, componentMap: ComponentMap): void {
  const content = stringify(componentMap, {
    indent: 2,
    lineWidth: 100,
  });

  writeFileSync(filePath, content, 'utf-8');
}

/**
 * ComponentMap を Component[] に変換
 */
export function componentMapToComponents(componentMap: ComponentMap): Component[] {
  const components: Component[] = [];

  for (const [filePath, definition] of Object.entries(componentMap.components)) {
    components.push({
      id: definition.id,
      type: definition.type,
      filePath,
      version: definition.version,
      status: definition.status,
      owners: definition.owners,
      provides: definition.provides ?? [],
      requires: definition.requires ?? [],
    });
  }

  return components;
}

/**
 * Component[] を ComponentMap に変換
 */
export function componentsToComponentMap(
  components: Component[],
  existingMap?: ComponentMap
): ComponentMap {
  const componentMap: ComponentMap = {
    version: existingMap?.version ?? '1.0',
    updated: new Date().toISOString(),
    signals: existingMap?.signals ?? [],
    components: {},
  };

  for (const component of components) {
    const definition: ComponentDefinition = {
      id: component.id,
      type: component.type,
      version: component.version,
      status: component.status,
      owners: component.owners,
      provides: component.provides.length > 0 ? component.provides : undefined,
      requires: component.requires.length > 0 ? component.requires : undefined,
    };

    componentMap.components[component.filePath] = definition;
  }

  return componentMap;
}

/**
 * ComponentMap の構造を検証
 */
export function validateComponentMap(componentMap: ComponentMap): ValidationResult[] {
  const results: ValidationResult[] = [];
  const seenIds = new Set<string>();

  for (const [filePath, definition] of Object.entries(componentMap.components)) {
    const errors: ValidationError[] = [];

    // 実ファイル存在チェック（リネーム後の _components.yaml 取り残しを検出）
    if (!existsSync(filePath)) {
      errors.push({
        type: 'missing-file',
        message: `Component file not found: ${filePath}`,
        field: 'filePath',
        value: filePath,
      });
    }

    // 必須フィールドの検証
    if (!definition.id) {
      errors.push({
        type: 'missing-field',
        message: 'Missing required field: id',
        field: 'id',
      });
    }

    if (!definition.type) {
      errors.push({
        type: 'missing-field',
        message: 'Missing required field: type',
        field: 'type',
      });
    }

    // ID重複チェック
    if (definition.id && seenIds.has(definition.id)) {
      errors.push({
        type: 'duplicate-id',
        message: `Duplicate component ID: ${definition.id}`,
        field: 'id',
        value: definition.id,
      });
    }

    if (definition.id) {
      seenIds.add(definition.id);
    }

    // type の妥当性チェック
    const validTypes = ['spec', 'guide', 'report', 'adr', 'checklist'];
    if (definition.type && !validTypes.includes(definition.type)) {
      errors.push({
        type: 'invalid-format',
        message: `Invalid type: ${definition.type}. Must be one of: ${validTypes.join(', ')}`,
        field: 'type',
        value: definition.type,
      });
    }

    if (errors.length > 0) {
      results.push({
        filePath,
        errors,
        warnings: [],
      });
    }
  }

  return results;
}

/**
 * 未解決の requires を検出
 */
export function findUnresolvedRequires(componentMap: ComponentMap): ValidationResult[] {
  const results: ValidationResult[] = [];
  const components = componentMapToComponents(componentMap);
  const componentById = new Map(components.map(c => [c.id, c]));

  for (const component of components) {
    const errors: ValidationError[] = [];

    for (const req of component.requires) {
      if (req.from) {
        // from が指定されている場合、その Component が存在するかチェック
        if (!componentById.has(req.from)) {
          errors.push({
            type: 'unresolved-require',
            message: `Component not found: ${req.from}`,
            field: 'requires',
            value: req.from,
          });
        }
      } else {
        // from が未指定の場合、誰かが provide しているかチェック
        const providers = components.filter(c =>
          c.provides.some(p => p.name === req.name && p.signal === req.signal)
        );

        if (providers.length === 0) {
          errors.push({
            type: 'unresolved-require',
            message: `No provider found for '${req.name}' (${req.signal})`,
            field: 'requires',
            value: req.name,
          });
        }
      }
    }

    if (errors.length > 0) {
      results.push({
        filePath: component.filePath,
        errors,
        warnings: [],
      });
    }
  }

  return results;
}
