import envData from '../../../../config/env.json';
import { getGuideUrl, isServerError } from './index';

const { forumLocation } = envData;

describe('index', () => {
  describe('getGuideUrl', () => {
    it('should use forum topic url when forumTopicId is supplied', () => {
      const value = getGuideUrl({
        forumTopicId: 12345,
        title: 'a sample title'
      });
      expect(value).toEqual(`${forumLocation}/t/12345`);
    });

    it('should use search endpoint when no forumTopicId is supplied', () => {
      const value = getGuideUrl({
        title: '& a sample title?'
      });
      expect(value).toEqual(
        `${forumLocation}/search?q=%26%20a%20sample%20title%3F%20in%3Atitle%20order%3Aviews`
      );
    });
  });

  describe('isServerError', () => {
    it('should return true when status is undefined', () => {
      const isError = isServerError();
      expect(isError).toEqual(true);
    });

    it('should return true when status is 500', () => {
      const isError = isServerError('500');
      expect(isError).toEqual(true);
    });

    it('should return false when status is 400', () => {
      const isError = isServerError('400');
      expect(isError).toEqual(false);
    });
  });
});
