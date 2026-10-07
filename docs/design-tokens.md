# GradGuide Design Tokens

Based on the styling extracted from the GradGuide website.

## Typography

| Element | Font Family | Size / Weight | Color | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Headings (h1)** | `Plus Jakarta Sans`, sans-serif | 60px / ExtraBold (800) | `#000000` | Headings use strong contrast and large sizes. |
| **Heading Emphasis (Italic)** | `Plus Jakarta Sans`, sans-serif | - / Italic | `#F25C5C` (Coral Red) | Used for emphasis within headings. |
| **Body text** | System sans-serif | 14px / Regular (400) | `#000000` | Plain, readable body text. |
| **Eyebrow / Small labels** | `Plus Jakarta Sans`, sans-serif | 13px | `#F25C5C` (Coral Red) | Uppercase text (`text-transform: uppercase` is likely used in context). |

## Colors

| Token | Hex Value | RGB Value | Usage |
| :--- | :--- | :--- | :--- |
| **Background** | `#FEF7EF` | `rgb(254, 247, 239)` | Main page background (warm off-white/cream). |
| **Text (Primary)** | `#000000` | `rgb(0, 0, 0)` | Default text color. |
| **Primary / Accent** | `#F25C5C` | `rgb(242, 92, 92)` | Used for italic emphasis in headings and large elements. |
| **Primary (Accessible)** | `#D93838` | `rgb(217, 56, 56)` | Darker coral for small text, badges, and links to meet 4.5:1 contrast against cream background. |
| **Button Background**| `#333333` | `rgb(51, 51, 51)` | Default dark button backgrounds. |
| **Surface / Card** | `transparent`* | `rgba(0, 0, 0, 0)`* | *Unable to identify with confidence. Cards may just use borders or subtle shadows on the main background.* |

## Components & Layout

| Token | Value | Notes |
| :--- | :--- | :--- |
| **Button Radius** | `200px` | Pill-shaped buttons (`rounded-full`). |
| **Form Inputs** | `0px` radius* | *Unable to identify with confidence, styling seems minimal or using bottom borders.* |
| **Card Styling** | Minimal / None* | *Unable to identify with confidence. No strong box-shadows detected.* |

*(Note: Some specific component values like card backgrounds, input styles, and spacing scales could not be confidently extracted and should be interpreted loosely based on standard modern web design practices matching the color palette).*
