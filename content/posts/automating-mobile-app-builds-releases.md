---
title: "Automated Mobile iOS & Android Builds using Fastlane and CircleCI"
date: 2021-06-02T08:00:00+01:00
draft: false
tags: ["mobile", "ci/cd", "fastlane", "circleci", "ios", "android"]
categories: ["mobile", "ci/cd", "devops", "cloud"]
---

I was recently tasked with automating the iOS and Android build and releases at
my work last month. We had some compliance checks coming up, and instead of
making 2+ dev machines a part of the audit process, the decision was made to
fully automate the build and release process.

After doing some initial digging, I realized that there was a bit more to it
than I had first thought, primarily due to the fact that the current process
involved a designated individual from each team doing a manual clean build and
upload, using shared certificates and keys. While it was theoretically possible
that the compliance check could audit the existing process (e.g., dev machines),
it would be less than ideal.

Developing the pipelines would require:

- Running builds on linux (Android) and macOS (iOS) machines
- Handling of app signing keys/certificates so developers could not create a
  production build on their machines
- Considering how gradle (Android) and Cocoapod (iOS) dependencies would be
  handled
- Uploading app build artifacts to Google Play Store (Android), Firebase App
  Distribution (Android), and TestFlight (iOS)
- Allowing branch-dependent flows that meet each teams testing and distribution
  needs

After spending some time considering these requirements for both the iOS and
Android build/release processes, I wanted the following to be true:

1. Each app's build/release would not be comprised of a long bash script
2. As identical build processes between apps as possible
3. No unencrypted signing keys/certificates in the repo or lying around on the
   devs' machines
4. Minimal manual management (creation, renewal, revocation) of signing
   keys/certificates
5. Making new production releases would still be possible while I was automating
   the process
6. Both iOS and Android builds/releases would run in the "same place"
7. No managing our own Mac instance _somewhere_ (**No Mac Minis in a random
   maintenance room!**)

Cursory research revealed a few different options, but there was a general
consensus regarding one of the best tools to use structuring the build and
release for both platforms, and that tool is
[fastlane](https://fastlane.tools/).

## Fastlane -- an oldie but a goodie

Acquired in 2017 by Google, fastlane is an open-source project designed with a
number of actions (built in methods, essentially) and extendable plugins that
can be used to take screenshots, build, and sign both iOS and Android
applications. While teams use fastlane for doing builds and uploads both locally
and on their build servers, neither team at my company was using it.

Fastlane's builtin and plugin-able actions would mean that I wouldn't need to
reinvent the wheel and script the builds and releases for both iOS and Android.
While bash and curl share a warm (and sometimes cursed) place in my heart,
sometimes it's nicer to use someone else's clear, easily implementable code.

In addition, the structure of the apps' repos would also mirror each other in
their structure, so determining the build/release process across the apps would
be straightforward.

I decided that using fastlane for automating builds and releases would help me
check off, or at least would get me closer to checking off, the following from
my requirement list:

1. [x] Each app's build/release would not be comprised of a long bash script
2. [x] As similar build processes between apps as possible

## App Signing

Both mobile apps need to be signed, and while the concept is largely the same
between platforms, the implentation differs a bit -- including on fastlane side
of things.

For iOS, fastlane has something called
[match](https://docs.fastlane.tools/actions/match/), which is a tool that works
directly with the App Store Connect API to manage your app's certificate. While
it is mostly for automatically managing your certs and profiles, it is also
possible to import and use pre-existing certificates.

Since I needed to make sure I didn't break the current app distribution setup,
the ability to keep the same certificate was important. In addition, using a
tool like match to manage certs makes generating new ones straightforward.

Finally, since there are multiple options for storing the encrypted certs,
including a private git repository, S3, and Google Storage Buckets, it is
possible to still gain secure access to the certificates from multiple
locations, while simultaneously controlling access to them in a granular
fashion. This effectively meant that I could create a setup where encrypted
certificates were stored in a place only the build server could access.

Since fastlane match is quite nice for handling iOS certs, how about Android
Play Store? There is no match for Android, and this seems largely due to the
fact that the Play Store has a feature to "let" the Play Store manage your app's
signing key, called [Play App
Signing](https://support.google.com/googleplay/android-developer/answer/9842756?hl=en).

While this can be a good option -- it helps prevent issues related to sharing
and storing signing keys (Play Store holds the signing key and provides an
upload key, which is then used to upload the app to the Play Store) -- it is
literally impossible opt out of Play App Signing after one has opted in. New
apps are automatically enrolled, but if you have an existing app and are
considering switching, just be sure of the ramifications.

In practice, this resulted in saving an encrypted upload key on the environment
of the build server that is used to sign the app before uploading to the Play
Store. If the upload key is lost or compromised, a new one can be requested
through the Play Store. This is not the case for the original signing key (the
one Google manages when using Play App Signing). If the original signing key is
lost or compromised, there is no option to be issued a new.

We needed to enroll our app into Play App Signing, but after we did this and
started using match to manage the iOS app's certs, I could check some remaining
requirements:

3. [x] No unencrypted signing keys/certificates in the repo or lying around on
       the devs' machines
4. [x] Minimal manual management of signing keys/certificates
5. [x] It would still be possible to make a new production release while I was
       automating the process

## CircleCI

Now we come to the final component, which is running the actual builds. There
are many options for CI/CD services these days, including ones that are targeted
directly for doing app builds. Since I was using fastlane, which is
service-agnostic, I could have run builds on almost any service.

But since I was working with a deadline, my biggest concern was avoiding the
hosting our own macOS machine. This would likely end up being costly, requiring
developer time for patching/updates, and raising the risk of downtime. After
looking over pricing, documentation, and user experience, I decided to go with
CircleCI.

CircleCI has strong support for fastlane, has good documentation for setting
updates iOS and Android builds, and has macOS machines available to use
out-of-the-box. After perusing the documentation and giving it a little test, I
determined I would be able to make long strides quickly with CircleCI. After
having implemented the end-to-end builds and releases for our iOS and Android
apps, I still feel good about choosing CircleCI.

In addition, it helped me cross off the final requirements from my list:

6. [x] Both iOS and Android builds/releases would run in the "same place"
7. [x] No managing our own Mac instance _somewhere_ (**No Mac Minis in a random
       maintenance room!**)

All in all, the process was fun to automate, and it was a good experience using
relatively mature tools to complete the job. The most challenging parts were
determining the best strategy for app signing and ensuring developer's could
work and distribute as normal while automating the process, but I will have more
on those topics in a later post.
