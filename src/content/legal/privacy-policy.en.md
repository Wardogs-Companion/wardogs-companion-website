# Privacy Policy

**WARDOGS Companion**, unofficial community extension for Twitch

Effective date: September 30, 2026

This policy explains what data the WARDOGS Companion extension handles, why, for how long, and what your rights are. It applies to viewers who see the extension on a channel and to broadcasters who install it.

## 1. Who is responsible

WARDOGS Companion is a free, unofficial community extension for Twitch. It is created and published under the name BiggyQLF by an individual developer based in France (“the developer”).

The developer is the data controller for the processing carried out by the extension. Twitch is responsible for its own processing (see section 8).

Contact: wardogscompanion@gmail.com

The extension is not made, endorsed, sponsored or supported by BULKHEAD, Team17 or Twitch, and is not affiliated with them.

## 2. In short

- The extension has no server of its own: all data it exchanges goes through Twitch. Only messages you send to wardogscompanion@gmail.com reach the developer directly.
- Viewers: the developer receives no data about you. The technical information Twitch gives the extension stays in the page’s memory (section 3), and the extension only remembers, in your own browser, where you placed its button and panel, and the panel’s size, for 13 months at most.
- Broadcasters: the loadout you publish, including the display name you type, is public. Anyone watching your channel can see it, and it is stored by Twitch.
- No audience-measurement tool in the extension, no advertising, no tracking, no profiling, no sale or sharing of data.
- No cookies: only display preferences in your browser’s local storage (section 6).

## 3. Data processed through Twitch for the extension to work

When the extension opens, it loads Twitch’s own helper script, and Twitch gives it technical information: the channel ID, an opaque user identifier (not your username) and access tokens. The extension keeps this information in the page’s memory only, to connect to Twitch services. It never reads the opaque user identifier, does not store any of this information and sends it only to Twitch. This information is gone once the page is closed.

The extension does not ask viewers to share their Twitch identity and does not read their username, role or subscription.

For viewers, the display language follows the language Twitch indicates for the page: French if that language is French, English in every other case. It is not stored. In the editor, the language the broadcaster chooses is remembered in their browser (section 6).

## 4. The loadout published by the broadcaster

**What it contains**

- the display name you type (required, 40 characters maximum): it can be any text, so choose it knowing that it will be public;
- the date and time of publication, taken from your computer’s clock;
- your in-game choices: map, team, weapons and attachments, equipment, backpack contents, quick-access items and their key labels, vehicles and levels.

It contains no technical Twitch identifier (numeric or opaque ID) and no token. It contains your channel name only if you type it or pick the suggestion (section 5).

**When it is sent**

Only when you click “Publish changes” in the editor (the extension’s configuration page or its Live Config panel). Each time you publish, the new loadout entirely replaces the previous one. The extension keeps no history.

**Who can see it**

Twitch stores the loadout as your channel’s extension configuration and delivers it to your viewers, including live to those already watching. Anyone watching your channel can see it, including the display name and the date and time it was last published. Twitch’s documentation treats saved extension configurations as public.

Twitch gives extension owners the technical means to read or overwrite the configuration saved on a channel. The developer uses them only to answer a request for a copy or erasure of that configuration (section 11).

**Changing or removing it**

You can change your loadout in the editor at any time and publish again.

To remove it entirely, use the “Clear published loadout” button at the foot of the editor, then confirm. The saved configuration is then replaced with a mere marker that holds only the date and time of the clearing, and your viewers see an empty panel at once, as before your first publication. If you can no longer open the editor, write to wardogscompanion@gmail.com (see section 11).

## 5. Channel-name suggestion in the editor

When a broadcaster opens the editor inside Twitch, the extension sends one request to the Twitch API (api.twitch.tv) for the channel’s public account information and reads only the channel’s name. It shows this name to the broadcaster as a “Use channel name” suggestion.

The name stays in the page’s memory. It enters the loadout only if the broadcaster clicks the suggestion and then publishes. Otherwise it is never stored. This request is made only in the editor, never in the panel shown to viewers.

## 6. Storage in your browser

The extension uses your browser’s local storage (localStorage) for display preferences only. The Twitch Developer Services Agreement treats this kind of storage in the same way as cookies. These values stay on your device, stored under the domain that serves extensions (ext-twitch.tv) and, in most recent browsers, under the twitch.tv site where the extension is shown. The extension never sends them to the developer or to anyone else, and they do not identify you.

| Key | Content | Purpose | Duration |
|---|---|---|---|
| `wardogs-launcher-place-v1` | position (x, y) and date saved | Viewers: remembers where you dragged the button that opens the panel | 13 months at most after the button was last moved; deleted sooner if you clear your browser data |
| `wardogs-panel-place-v1` | position and size (x, y, scale) and date saved | Viewers: remembers where you placed the panel and how you sized it | 13 months at most after the panel was last moved or resized; deleted sooner when you double-click a resize handle (which restores the default size and position; handles appear only when the panel can be enlarged) or clear your browser data |
| `wardogs-language-creator-v1` | “en” or “fr” and date saved | Broadcasters: remembers the language chosen in the editor | 13 months at most after the language was last chosen; deleted sooner if you clear your browser data |

Each preference is saved with its date. After 13 months the extension no longer reads it and deletes it the next time it opens; viewing or using the extension does not extend this period, only a new choice of yours does. This period keeps within the 13-month limit that the Twitch Developer Services Agreement sets for this kind of storage.

These preferences result from your own actions and serve only to provide the display you asked for. Under Article 82 of the French Data Protection Act (loi Informatique et Libertés), as interpreted by the CNIL (the French data protection authority), they therefore do not require consent. They are used for no other purpose.

To delete them, clear the site data for twitch.tv and ext-twitch.tv, or all browsing data, in your browser settings. If your browser blocks storage, the extension still works and your choices last until the page is reloaded.

The extension’s code contains one more key, `wardogs-twitch-preview-v1`, used only when the extension runs outside Twitch, for the developer’s own testing. It is never used on Twitch.

## 7. What the extension does not do

- No server or back end of its own: the data described above reaches the developer only if a broadcaster asks for a copy or erasure of their configuration (section 11).
- No analytics, statistics or audience-measurement tool in the extension. Usage statistics that Twitch compiles about extensions are Twitch’s responsibility (section 8).
- No advertising, no tracking, no profiling, no automated decision-making.
- No cookies set by the extension’s own code (only the local storage described in section 6). Twitch’s helper script and website are covered by Twitch’s Privacy Notice.
- No third-party service other than Twitch: fonts and images are shipped with the extension.
- No sale, rental or sharing of data. The only recipients are Twitch, the channel’s viewers for the published loadout, and the developer’s e-mail provider for messages sent to wardogscompanion@gmail.com.
- No purchases, no Bits, no account linking.

## 8. Twitch and transfers outside the European Union

Twitch Interactive, Inc. operates the platform on which the extension runs. It hosts the extension, provides the helper script that every extension page loads, stores the published loadout and delivers it to viewers, and answers the channel-name request. Twitch also collects and analyses how extensions are used, and may keep copies of extensions and their associated content under its own rules.

Twitch acts under its own responsibility and its own Privacy Notice: <https://legal.twitch.com/en/legal/privacy-notice/>. For data held by Twitch, you can contact Twitch directly.

The extension’s code sends no data anywhere other than to Twitch. Twitch is based in the United States and may process data there or in other countries, with the safeguards described in its Privacy Notice.

Messages sent to wardogscompanion@gmail.com are hosted by the developer’s e-mail provider, acting on the developer’s behalf. If that provider processes data outside the European Union, it does so with the safeguards provided by the GDPR (adequacy decision or European Commission standard contractual clauses).

## 9. Legal bases

| Processing | Legal basis |
|---|---|
| Publishing the broadcaster’s loadout and delivering it to viewers | Performance of the terms of use accepted by the broadcaster (GDPR, art. 6(1)(b)) |
| Technical information supplied by Twitch, kept in page memory so the extension works | Legitimate interest in making the extension work on the channel (GDPR, art. 6(1)(f)); for the broadcaster, performance of the terms of use (art. 6(1)(b)) |
| Channel-name suggestion | Legitimate interest in making the display name easy to fill in, using the channel’s public name, shown only to the broadcaster and stored only if the broadcaster chooses to publish it (GDPR, art. 6(1)(f)) |
| Display preferences in local storage | Access to your device exempt from the consent requirement (French Data Protection Act, art. 82: interface personalisation requested by the user); insofar as these values are personal data, legitimate interest in keeping the display you chose (GDPR, art. 6(1)(f)) |
| Answering messages sent to wardogscompanion@gmail.com | Legitimate interest in answering questions and providing support (GDPR, art. 6(1)(f)) |
| Handling requests to exercise your rights (section 11) | Legal obligation (GDPR, art. 6(1)(c)) |

No processing relies on consent. The display name is required to publish a loadout; every other field is optional. Not using the editor only means that no loadout is shown.

## 10. Retention periods

| Data | Retention |
|---|---|
| Published loadout | Stored by Twitch until the broadcaster publishes a new one, which replaces it, or clears it with the “Clear published loadout” button (or on request). After a clearing, only the date and time of the clearing remain saved. Twitch may keep copies under its own rules. |
| Technical information from Twitch; channel name read in the editor | Page memory only, until the page is closed |
| Display preferences | On your device, 13 months at most after your last choice, or until you delete them (section 6) |
| Messages sent to wardogscompanion@gmail.com | As long as needed to handle the request and any follow-up |

The extension collects nothing after a broadcaster deactivates or uninstalls it. What then happens to the saved configuration is up to Twitch; to erase it, use the “Clear published loadout” button before deactivating the extension, or write to wardogscompanion@gmail.com.

## 11. Your rights

Under the GDPR, you have the right to access, rectify and erase your data, to restrict its processing, to object to processing based on legitimate interest, and to data portability, where these rights apply.

- **Broadcasters**: correct your loadout yourself in the editor, then publish again, or erase it entirely with the “Clear published loadout” button (section 4). For a copy of your published configuration, or its erasure if you can no longer open the editor (replacement of the saved configuration with an empty one), write to wardogscompanion@gmail.com. The developer will then act through the tools Twitch provides to extension owners.
- **Viewers**: the developer holds no data about you and cannot identify you. Your display preferences are on your own device, and you can delete them yourself (section 6). For data held by Twitch, contact Twitch.
- **Everyone**: write to wardogscompanion@gmail.com. You will receive an answer within one month. This period can be extended by two months for complex requests; you will then be informed of this within the first month, with the reasons. Exercising your rights is free. If your request concerns a channel, proof that you control it may be requested only if there is reasonable doubt.

You can also set instructions on what happens to your data after your death (French Data Protection Act, art. 85). The published configuration stays stored by Twitch until it is replaced or erased; the broadcaster can clear it from the editor, and their heirs can ask for its erasure at wardogscompanion@gmail.com.

In addition, you can lodge a complaint with the CNIL (<https://www.cnil.fr/fr/plaintes>, in French) or with the data protection authority of the EU country where you live or work.

## 12. Children

Twitch does not allow children under 13 (or under a higher minimum age in some countries), and minors must use Twitch under the supervision of a parent or legal guardian. The extension is not directed at children under 13 and does not knowingly collect data about them.

## 13. Security

The extension has no server and no user accounts. The access tokens supplied by Twitch stay in page memory and are sent only to Twitch. The extension’s code contains no secrets (keys or passwords). Every loadout received is checked (size, format and expected values) before it is displayed.

## 14. Changes to this policy

This policy may be updated, in particular when the extension changes. The new version will be published at the same address with a new effective date. If a change significantly affects how data is handled, it will be highlighted at the top of this page.

This policy is available in French and English, with the same content. If the two versions differ, the French version prevails.

## 15. Contact

For any question about this policy or your data: wardogscompanion@gmail.com
