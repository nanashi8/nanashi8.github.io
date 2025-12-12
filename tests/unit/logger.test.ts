import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '@/utils/logger';

/**
 * Logger utility テスト
 *
 * 開発環境でのログ出力を検証
 */

describe('Utils - logger', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    // console メソッドをモック
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    // モックをリストア
    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('logger.log', () => {
    it('メソッドが存在し呼び出せる', () => {
      expect(() => logger.log('test message')).not.toThrow();
    });

    it('複数の引数を渡せる', () => {
      expect(() => logger.log('message', 123, { key: 'value' })).not.toThrow();
    });
  });

  describe('logger.warn', () => {
    it('メソッドが存在し呼び出せる', () => {
      expect(() => logger.warn('warning message')).not.toThrow();
    });

    it('複数の引数を渡せる', () => {
      expect(() => logger.warn('warning', 456)).not.toThrow();
    });
  });

  describe('logger.error', () => {
    it('console.errorを常に呼び出す', () => {
      logger.error('error message');
      expect(consoleSpy.error).toHaveBeenCalledWith('error message');
    });

    it('複数の引数を渡せる', () => {
      logger.error('error', new Error('test'));
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('エラーオブジェクトを渡せる', () => {
      const error = new Error('test error');
      logger.error('Error occurred:', error);
      expect(consoleSpy.error).toHaveBeenCalledWith('Error occurred:', error);
    });
  });

  describe('呼び出し回数', () => {
    it('errorは複数回呼び出せる', () => {
      logger.error('first');
      logger.error('second');
      logger.error('third');

      expect(consoleSpy.error).toHaveBeenCalledTimes(3);
    });

    it('エラーログは常に出力される', () => {
      logger.error('critical error');

      // errorは環境に関わらず常に呼ばれる
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledWith('critical error');
    });
  });

  describe('追加メソッド', () => {
    it('debugメソッドが存在する', () => {
      expect(typeof logger.debug).toBe('function');
      expect(() => logger.debug('debug message')).not.toThrow();
    });

    it('infoメソッドが存在する', () => {
      expect(typeof logger.info).toBe('function');
      expect(() => logger.info('info message')).not.toThrow();
    });
  });
});
