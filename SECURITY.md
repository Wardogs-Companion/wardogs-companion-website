# Security

If you find a security issue on the website or in this repository, please report it privately through GitHub: open the **Security** tab of this repository and choose **Report a vulnerability**.

Please do not open a public issue or pull request for a security problem.

This repository is public. It holds no secrets. Builds on Vercel read a Vercel Blob token from Vercel's own environment to fetch the media of the home page's intro; it is never in the repository, and the website builds without it (without the intro).
