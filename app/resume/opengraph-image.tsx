import { siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderOgImage,
} from "@/lib/og-image";

export const alt = i18n.resume.pageTitle;
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderOgImage(siteConfig.person.fullName, i18n.resume.summaryContent);
}
