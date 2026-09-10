#!/usr/bin/env node

const { loadEnv } = require('vite');
const { writeFileSync } = require('fs');
const { resolve } = require('path');

/**
 * @name toTypeScriptType
 * @description 환경 변수 객체의 키-밸류를 분석하여 TypeScript 인터페이스의 내부 바디(Body) 문자열로 변환
 *              기본적으로 모든 값은 string으로 처리 (예외 boolean 타입만 구별하여 매핑)
 * @returns {string} TypeScript 타입 정의 문자열 (예: '{\n  readonly MODE: string;\n}')
 */
function toTypeScriptType(obj) {
  const entries = Object.entries(obj)
    .map(([key, value]) => {
      const type = typeof value === 'boolean' ? 'boolean' : 'string';
      return `  readonly ${key}: ${type};`;
    })
    .join('\n');
  return `{\n${entries}\n}`;
}

/**
 * @name buildMode
 * @description 지정된 환경 모드별(development, staging, production) .env 파일들을 읽어와
 *              최종적으로 Vite가 인식하는 전역 환경 변수 타입 정의 파일(.d.ts)을 자동 생성.
 */
function buildMode(modes, filePath) {
  try {
    const interfaces = modes.map((mode) => {
      const name = `${mode.charAt(0).toUpperCase() + mode.slice(1)}Env`;
      const rawEnvs = loadEnv(mode, process.cwd(), 'VITE_');

      // Vite 내장 기본 주입 변수와 수동 결합
      const envs = {
        MODE: mode,
        PROD: mode === 'prod',
        DEV: mode !== 'prod',
        ...rawEnvs,
      };

      const interfaceDeclaration = `export interface ${name} ${toTypeScriptType(envs)}`;

      return { name, interfaceDeclaration };
    });

    // 인터페이스들을 하나로 합침
    const str = interfaces
      .map(({ interfaceDeclaration }) => interfaceDeclaration)
      .join('\n\n');

    // ImportMetaEnv가 다중 상속(extends)받을 대상 리스트 콤마 결합
    const extendList = interfaces.map(({ name }) => name).join(', ');

    // 최종 컴파일 파일에 담길 번들 템플릿 코드 구성
    const finalContent = `/* eslint-disable */
    // 이 파일은 buildMode 스크립트에 의해 자동 생성되었습니다. 수동으로 수정하지 마세요.
    ${str}

    export interface ImportMetaEnv extends ${extendList} {}

    interface ImportMeta {
      readonly env: ImportMetaEnv;
    }
    `;

    // 최종 타입 정의 파일(env.d.ts)을 UTF-8 인코딩으로 파일 시스템에 동기 작성
    writeFileSync(filePath, finalContent, { encoding: 'utf-8' });
  } catch (err) {
    console.error('❌ [EnvType Error] 환경 변수 타입 파일 생성 중 실패:');
    console.error(`👉 원인: ${err.message}`);
  }
}

// 스크립트 실행: 3가지 모드에 대한 타입을 types/env.d.ts 파일에 자동 생성
buildMode(
  ['dev', 'stag', 'prod'],
  resolve(process.cwd(), './types/env.d.ts'),
);
