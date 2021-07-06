import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as WaylonImage from '../src/stack/lib/waylon-image-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new WaylonImage.WaylonImageStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
