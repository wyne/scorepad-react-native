import { SemVer } from 'semver';

import { getPendingOnboardingSemVer } from './Onboarding';

describe('onboarding', () => {
    it('should return the default if onboarded to 0.0.0', () => {
        const applicableVersion = getPendingOnboardingSemVer(new SemVer('0.0.0'));

        expect(applicableVersion).toBe('2.2.2');
    });

    it('should return the default if null', () => {
        const applicableVersion = getPendingOnboardingSemVer(null);

        expect(applicableVersion).toBe('2.2.2');
    });

    it('should return the latest applicable screens', () => {
        const applicableVersion = getPendingOnboardingSemVer(new SemVer('2.4.0'));

        expect(applicableVersion).toBe('2.5.0');
    });

    it('should not return if caught up', () => {
        const applicableVersion = getPendingOnboardingSemVer(new SemVer('2.6.0'));

        expect(applicableVersion).toBeUndefined();
    });
});
