import { SemVer } from "semver";

import { getOnboardingSemVer } from "./Onboarding";

describe('onboarding', () => {
    it('should return the default if onboarded to 0.0.0', () => {
        const applicableVersion = getOnboardingSemVer(new SemVer('0.0.0'));

        expect(applicableVersion).toBe('2.2.2');
    });

    it('should return the default if null', () => {
        const applicableVersion = getOnboardingSemVer(null);

        expect(applicableVersion).toBe('2.2.2');
    });

    it('should return the latest applicable screens', () => {
        const applicableVersion = getOnboardingSemVer(new SemVer('2.4.0'));

        expect(applicableVersion).toBe('2.5.0');
    });

    it('should not return if caught up', () => {
        const applicableVersion = getOnboardingSemVer(new SemVer('2.6.0'));

        expect(applicableVersion).toBeUndefined();
    });
});
