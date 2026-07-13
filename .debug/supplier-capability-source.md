# Extracted production-capability evidence

Generated from the SHA-verified `spec.full.md`; temporary audit evidence only.

## Source lines 34-63

00034: 
00035: ## 2. Product positioning
00036: 
00037: OpenMarket is not a general marketplace and not a generic multi-sector directory.
00038: 
00039: Its product promise is:
00040: 
00041: > Find Turkish home and contract textile suppliers, compare products using textile-specific data, and send a structured buying request for one item or a complete procurement package.
00042: 
00043: The platform should be useful to:
00044: 
00045: - Importers and distributors
00046: - Retail and private-label buyers
00047: - Hotel, resort and spa procurement teams
00048: - Hospital and clinic procurement teams
00049: - Dormitory, residence and hostel operators
00050: - Interior design, fit-out and project procurement companies
00051: - Wholesalers and buying offices
00052: 
00053: Consumer retail shopping is not supported.
00054: 
00055: ## 3. Scope-reduction decisions
00056: 
00057: Version 2.0 deliberately removes general-purpose complexity from the original platform definition.
00058: 
00059: ### 3.1 One vertical, not multiple sectors
00060: 
00061: There is one commercial vertical: **Home & Contract Textiles**.
00062: 
00063: Home, hotel, hospital and dormitory are modelled as **application contexts**, not duplicated sector trees.

## Source lines 65-94

00065: A product can support one or more application contexts.
00066: 
00067: ### 3.2 One category tree
00068: 
00069: The platform uses a single textile product category tree. Category definitions are shared across application contexts.
00070: 
00071: Application-specific requirements are added through overlay rules. For example, a bed sheet remains one product category, while hospital use can add industrial-wash, bleach-resistance or liquid-barrier fields.
00072: 
00073: ### 3.3 Textile-only schema engine
00074: 
00075: The platform retains configurable, typed product fields, but does not launch with a generic cross-industry parameter and unit engine.
00076: 
00077: Only textile, packaging, capacity and commercial measurement families required by the launch scope are seeded.
00078: 
00079: ### 3.4 Company activation and claim verification are separated
00080: 
00081: Supplier activation depends on company identity and minimum supplier documentation.
00082: 
00083: Product certifications and performance claims are reviewed separately. A supplier does not remain blocked because an optional claim document is still pending.
00084: 
00085: ### 3.5 Multi-line RFQs are core
00086: 
00087: Hotel, hospital and dormitory purchasing frequently covers a package of products. An RFQ can therefore contain one or many line items.
00088: 
00089: ### 3.6 Fixed launch roles
00090: 
00091: The launch uses a small set of fixed operational roles. Arbitrary custom roles, complex delegation and sector-subtree permission design are deferred.
00092: 
00093: ### 3.7 Bilingual launch
00094: 

## Source lines 107-138

00107: 9. A buyer needs a verified business identity before commercial interaction.
00108: 10. A supplier needs a verified company email, minimum company profile and approved company documents before commercial activation.
00109: 11. Complete products from active suppliers publish automatically after validation; moderation occurs after publication.
00110: 12. High-risk or regulated-sounding claims cannot be publicly presented as reviewed without approved evidence.
00111: 13. One account can have both Buyer and Supplier workspaces.
00112: 14. Product categories, product templates, application overlays, document rules, filters and RFQ fields are database-driven.
00113: 15. Other industrial sectors cannot be created or exposed in the launch product.
00114: 
00115: ## 5. Commercial scope
00116: 
00117: ### 5.1 Included product model
00118: 
00119: The platform covers finished, semi-finished and made-to-order textile products intended for home or institutional accommodation use.
00120: 
00121: Included products must be suitable for catalogue listing, project procurement or private-label ordering.
00122: 
00123: ### 5.2 Application contexts
00124: 
00125: Each product and RFQ can be assigned to one or more of these contexts:
00126: 
00127: - **Home & Retail**
00128: - **Hotel & Hospitality**
00129: - **Hospital & Healthcare Accommodation**
00130: - **Dormitory & Institutional Accommodation**
00131: 
00132: Application contexts affect:
00133: 
00134: - Product form fields
00135: - Filters
00136: - RFQ questions
00137: - Matching rules
00138: - Required or claim-dependent documents

## Source lines 140-169

00140: 
00141: Application contexts do not create duplicate product records.
00142: 
00143: ### 5.3 Supplier types
00144: 
00145: Supported supplier types:
00146: 
00147: - Manufacturer
00148: - Manufacturer-exporter
00149: - Exporter or trading company
00150: - Authorized distributor
00151: - Contract textile project supplier
00152: - Private-label supplier
00153: 
00154: A supplier can have more than one type.
00155: 
00156: ## 6. Seeded product taxonomy
00157: 
00158: The root taxonomy is **Home & Contract Textiles**.
00159: 
00160: ### 6.1 Bed linen
00161: 
00162: - Flat sheets
00163: - Fitted sheets
00164: - Duvet covers
00165: - Pillowcases
00166: - Pillow shams
00167: - Bed linen sets
00168: - Bedspreads and coverlets
00169: - Blankets and throws

## Source lines 226-286

00226: This category does not include sterile products, surgical textiles, PPE or medical devices.
00227: 
00228: ### 6.6 Project sets and procurement packages
00229: 
00230: Catalogue products remain individually categorized. Buyers can group multiple categories in one RFQ.
00231: 
00232: Seeded RFQ package templates include:
00233: 
00234: - Hotel guest-room textile package
00235: - Hotel bathroom and spa package
00236: - Hospital bed-linen package
00237: - Dormitory room starter package
00238: - Home-textile private-label collection
00239: - Restaurant and banquet textile package
00240: 
00241: A catalogue-level bundle product can be added later but is not required for launch.
00242: 
00243: ## 7. Product data model
00244: 
00245: Every product has fixed core fields and typed category-specific fields.
00246: 
00247: ### 7.1 Fixed core fields
00248: 
00249: - Supplier
00250: - Product name
00251: - Primary category
00252: - Application contexts
00253: - Source language
00254: - Short description
00255: - Long description
00256: - Country of origin
00257: - Product status
00258: - Product images
00259: - Optional technical files
00260: - MOQ and MOQ unit
00261: - Sample availability
00262: - Sample lead time
00263: - Production lead time
00264: - Production capacity and period
00265: - Private-label availability
00266: - Logo or embroidery customization
00267: - Custom colour availability
00268: - Custom size availability
00269: - Packaging description
00270: - Incoterms
00271: - Supported currencies
00272: - Export markets
00273: - Claimed certifications
00274: 
00275: ### 7.2 Textile composition
00276: 
00277: Material composition is structured.
00278: 
00279: Each composition line contains:
00280: 
00281: - Fibre or material
00282: - Percentage
00283: - Optional component or layer
00284: 
00285: The total must equal 100%, except for products whose filling and shell are intentionally modelled as separate composition groups.
00286: 

## Source lines 329-405

00329: - Single select
00330: - Multi-select
00331: - Measured number
00332: - Measured range
00333: - Dimension set
00334: - Percentage
00335: - Material composition
00336: - Colour
00337: - File
00338: - Country
00339: - Currency
00340: 
00341: Generic date-range, electrical, chemical, automotive and machinery parameter types are not seeded.
00342: 
00343: ### 8.2 Seeded measurement families
00344: 
00345: - Length
00346: - Width
00347: - Height and depth
00348: - Area
00349: - Weight
00350: - Textile surface density
00351: - Yarn numbering
00352: - Thread count
00353: - Quantity
00354: - Packaging count
00355: - Production capacity
00356: - Temperature
00357: - Time
00358: - Percentage
00359: 
00360: ### 8.3 Seeded units
00361: 
00362: - mm, cm, m, inch
00363: - g, kg, tonne
00364: - GSM and g/m²
00365: - denier and tex
00366: - thread count
00367: - pcs, set, pair, roll
00368: - carton, bale and pallet
00369: - units per day, week or month
00370: - °C
00371: - day and week
00372: - percent
00373: 
00374: ### 8.4 Seeded option sets
00375: 
00376: - Textile fibres and materials
00377: - Weave types
00378: - Knit types
00379: - Yarn types
00380: - Filling materials
00381: - Finishing processes
00382: - Dyeing and printing methods
00383: - Embroidery and logo methods
00384: - Closure types
00385: - Edge and hem types
00386: - Colour families
00387: - Care and washing methods
00388: - Packaging types
00389: - Supplier types
00390: - Application contexts
00391: - Certifications and audit types
00392: - Incoterms
00393: - Currencies
00394: - Countries and export regions
00395: 
00396: Deactivation never deletes historical option values.
00397: 
00398: ## 9. Category templates and application overlays
00399: 
00400: The resolved product schema is produced from:
00401: 
00402: ```text
00403: Global textile fields
00404: → Category ancestor rules
00405: → Leaf-category template

## Source lines 423-454

00423: - Validation range
00424: - Display order
00425: - Filter visibility
00426: - RFQ visibility
00427: - Matching behaviour
00428: - Help text
00429: 
00430: ### 9.1 Home & Retail overlay
00431: 
00432: Typical additional fields:
00433: 
00434: - Retail collection name
00435: - Retail packaging
00436: - Barcode readiness
00437: - Private-label packaging
00438: - Colourway count
00439: - Seasonal collection availability
00440: - Consumer care-label support
00441: 
00442: ### 9.2 Hotel & Hospitality overlay
00443: 
00444: Typical additional fields:
00445: 
00446: - Industrial-laundry suitability
00447: - Recommended wash temperature
00448: - Wash-cycle durability declaration
00449: - Bleach resistance
00450: - Logo or monogram method
00451: - Room or department colour coding
00452: - Towel absorbency information
00453: - Blackout percentage where applicable
00454: - Flame-resistance claim where applicable

## Source lines 495-540

00495: - GSM
00496: - Weave or knit
00497: - Yarn type
00498: - Finish
00499: - Care instructions
00500: - Shrinkage declaration
00501: - Colour-fastness declaration
00502: - Pilling declaration
00503: - Customization
00504: - MOQ
00505: - Lead time
00506: - Capacity
00507: - Packaging
00508: - Certifications
00509: 
00510: ### 10.2 Bed-linen package
00511: 
00512: - Bed size standard
00513: - Sheet type
00514: - Mattress fit depth
00515: - Thread count
00516: - Yarn count
00517: - Weave
00518: - Fabric weight
00519: - Closure type
00520: - Set contents
00521: - Filling material
00522: - Filling weight
00523: - Quilting type
00524: - Warmth or seasonal use
00525: - Waterproof membrane where applicable
00526: 
00527: ### 10.3 Bath-textile package
00528: 
00529: - Towel type
00530: - GSM
00531: - Pile structure
00532: - Yarn type
00533: - Absorbency declaration
00534: - Border style
00535: - Hanging loop
00536: - Bathrobe model and collar type
00537: - Size range
00538: - Shrinkage declaration
00539: - Bleach resistance where applicable
00540: 

## Source lines 683-713

00683: - Chamber or activity document
00684: - Trade registry record
00685: - Tax or company registration
00686: - Authorized representative evidence
00687: - Company address evidence
00688: - Exporter information where applicable
00689: - Company profile
00690: 
00691: Manufacturer-specific documents:
00692: 
00693: - Capacity report where available
00694: - Industrial registry where applicable
00695: - Facility information
00696: - Machinery or production-line summary
00697: - Production photos
00698: - Quality management certificates where claimed
00699: 
00700: ### 12.2 Product and claim evidence
00701: 
00702: Claim evidence is required when a supplier asks the platform to present a claim as reviewed.
00703: 
00704: Seeded evidence types:
00705: 
00706: - OEKO-TEX certificate
00707: - GOTS certificate
00708: - GRS or RCS certificate
00709: - ISO 9001 certificate
00710: - Social-compliance audit report
00711: - Composition test report
00712: - Shrinkage and dimensional-stability test
00713: - Colour-fastness test

## Source lines 805-834

00805: Launch languages:
00806: 
00807: - Turkish
00808: - English
00809: 
00810: The supplier dashboard defaults to Turkish.
00811: 
00812: Translatable fields:
00813: 
00814: - Product name
00815: - Short description
00816: - Long description
00817: - Packaging description
00818: - Additional notes
00819: - Company description
00820: 
00821: A product requires content in at least one active language.
00822: 
00823: Fallback order:
00824: 
00825: 1. Selected language
00826: 2. English
00827: 3. Turkish
00828: 4. Source language
00829: 
00830: Missing translations do not affect ranking.
00831: 
00832: The data model must allow additional languages without product-table changes.
00833: 
00834: ## 15. Buyer RFQs and procurement projects

## Source lines 850-893

00850: ### 15.3 RFQ line item
00851: 
00852: Each line item contains:
00853: 
00854: - Product category
00855: - Quantity and unit
00856: - Optional target dimensions
00857: - Optional target composition
00858: - Optional colour or design requirement
00859: - Optional category-specific attributes
00860: - Required certifications or evidence
00861: - Customization requirements
00862: - Packaging requirements
00863: - Notes and attachments
00864: 
00865: ### 15.4 Additional RFQ details
00866: 
00867: Resolved fields appear under “Add more details” unless explicitly required.
00868: 
00869: Common additional fields:
00870: 
00871: - Target GSM or thread count
00872: - Fabric and weave
00873: - Wash-performance requirements
00874: - Waterproof or liquid-barrier requirement
00875: - Flame-resistance requirement
00876: - Logo or embroidery
00877: - Private label
00878: - Sample requirement
00879: - Incoterm
00880: - Target price indication
00881: - Partial supply allowed
00882: - Alternative specification allowed
00883: 
00884: Target price is optional and is never required for publication.
00885: 
00886: ### 15.5 RFQ states
00887: 
00888: - Draft
00889: - Published
00890: - Closed
00891: - Expired
00892: - Under review
00893: - Change requested

## Source lines 926-955

00926: - Supplier type
00927: 
00928: ### 16.2 Soft preferences
00929: 
00930: Possible soft preferences:
00931: 
00932: - Composition
00933: - GSM or thread count
00934: - Colour
00935: - Lead time
00936: - Incoterm
00937: - Export region
00938: - Private-label experience
00939: 
00940: ### 16.3 Informational fields
00941: 
00942: Informational fields do not affect match eligibility.
00943: 
00944: Matched RFQs appear in supplier dashboards and can trigger in-app or email notifications according to:
00945: 
00946: - Immediate
00947: - Daily summary
00948: - Weekly summary
00949: - Off
00950: 
00951: Supplier matching must explain which hard requirements matched or failed.
00952: 
00953: ## 17. Messaging and contact reveal
00954: 
00955: There is no open social messaging.

## Source lines 997-1026

00997: 
00998: - Application context
00999: - Category
01000: - Material composition
01001: - Dimensions
01002: - GSM
01003: - Thread count
01004: - Weave or knit
01005: - Colour family
01006: - MOQ
01007: - Custom size
01008: - Private label
01009: - Logo or embroidery
01010: - Claimed or reviewed certification
01011: - Supplier type
01012: - Country or region served
01013: - Lead time
01014: 
01015: Ranking uses only:
01016: 
01017: - Text relevance
01018: - Selected category
01019: - Application context
01020: - Explicit filters
01021: - Chronology when selected
01022: 
01023: There is no paid ranking and no hidden supplier-quality or profile-completion score.
01024: 
01025: Featured products use admin curation or controlled random selection. New products are chronological.
01026: 

## Source lines 1139-1168

01139: ## 21. Design specification
01140: 
01141: The selected direction remains red, editorial and catalogue-led, but photography and composition must reflect textiles and procurement rather than general industry.
01142: 
01143: ### 21.1 Editorial discovery
01144: 
01145: Homepage, application landing pages, collections and supplier showcases use:
01146: 
01147: - Large serif headlines
01148: - Red accents
01149: - Black and white foundations
01150: - Textile-detail photography
01151: - Factory, loom, finishing and hospitality imagery
01152: - Magazine-inspired compositions
01153: 
01154: ### 21.2 Directory experience
01155: 
01156: Search, product listings, supplier listings, product details and RFQs use:
01157: 
01158: - Dense readable grids
01159: - Strong filters
01160: - Clear material and specification data
01161: - Minimal decorative cards
01162: - Restrained editorial accents
01163: 
01164: ### 21.3 Operational interfaces
01165: 
01166: Buyer, Supplier, Admin and Moderator dashboards are sans-serif-first, functional and accessible.
01167: 
01168: Never use:

## Source lines 1506-1535

01506: 7. Supplier activates.
01507: 8. Complete product drafts publish automatically.
01508: 9. Supplier optionally uploads product-claim evidence.
01509: 10. Reviewed evidence labels appear after approval.
01510: 11. Matched RFQs and enquiries arrive.
01511: 
01512: ### 28.3 Buyer creates a hotel package RFQ
01513: 
01514: 1. Select Hotel & Hospitality.
01515: 2. Choose the hotel guest-room package template.
01516: 3. Add bed linen, towels, bathrobes and curtains as line items.
01517: 4. Enter quantities, dimensions and target delivery.
01518: 5. Add optional wash-performance, logo and packaging requirements.
01519: 6. Publish the RFQ.
01520: 7. Suppliers are matched by category and hard requirements.
01521: 8. A supplier responds to the full package or selected line items.
01522: 
01523: ### 28.4 Admin changes a product template
01524: 
01525: 1. Edit a category template or application overlay.
01526: 2. Preview resolved product and RFQ forms.
01527: 3. Review affected products and RFQ line items.
01528: 4. Resolve migration warnings.
01529: 5. Publish the new version.
01530: 6. Create an audit record.
01531: 
01532: ## 29. Permission matrix
01533: 
01534: Legend: ✓ allowed, — denied, C conditional by state or role.
01535: 

## Source lines 1660-1689

01660: - Donation payment details are handled by the configured external provider and are not stored by OpenMarket.
01661: - Public support, support-return and admin support-settings screens are implemented.
01662: - Turkish and English interfaces are usable.
01663: - The red editorial designs are implemented as reusable production components.
01664: - Audit records and handoff documentation remain current.
01665: 
01666: ## 32. Out of scope
01667: 
01668: - Any sector outside home and contract textiles
01669: - Fashion apparel and general clothing
01670: - Footwear and leather goods
01671: - Yarn, fibre and commodity raw-material trading as a standalone marketplace
01672: - Textile machinery and spare parts
01673: - Textile chemicals and dyes
01674: - Furniture, mattresses and non-textile interior products
01675: - Disposable medical supplies
01676: - Medical devices
01677: - PPE
01678: - Sterile and surgical textiles
01679: - Marketplace payment processing
01680: - Escrow
01681: - Logistics or customs brokerage
01682: - Automated quotation calculation
01683: - Contract generation
01684: - Paid promotion
01685: - In-platform donation payment processing
01686: - Donor-only product features, access or limits
01687: - Donor badges, public donor ranking or supplier influence
01688: - Donation-linked search, matching or moderation advantages
01689: - Unverified live donation counters or fabricated funding statistics

## Source lines 2078-2107

02078: | S02 | Supplier onboarding checklist | /supplier/onboarding | SupplierShell, OnboardingStepper, ChecklistCards, BlockingIssuePanel, ContinueActions | MVP |
02079: | S03 | Company profile | /supplier/company | SupplierShell, PageHeader, CompanyProfileForm, MediaUploader, ExportMarketsSelector, SaveBar | MVP |
02080: | S04 | Supplier types and capabilities | /supplier/capabilities | SupplierShell, CapabilitySelector, SupplierTypeCards, ApplicationContextSelector, ProductionCapabilityForm, SaveBar | MVP |
02081: | S05 | Company documents | /supplier/documents/company | SupplierShell, PageHeader, RequirementSummary, DocumentStatusList, ExpiryBadges, UploadActions | MVP |
02082: | S06 | Company document upload | /supplier/documents/company/new | SupplierShell, DocumentTypeSelector, FileUploader, MetadataForm, SensitivityNotice, SubmitBar | MVP |
02083: | S07 | Company document status detail | /supplier/documents/company/:id | SupplierShell, DocumentViewer, ReviewTimeline, RejectionReason, ReplacementUploader, PublicVisibilityToggle | MVP |
02084: | S08 | Products list | /supplier/products | SupplierShell, PageHeader, ProductStatusTabs, SearchFilterBar, ProductManagementTable, BulkActions, Pagination | MVP |
02085: | S09 | Product wizard — basics | /supplier/products/new/basics | SupplierShell, FormStepper, CoreProductFields, SourceLanguageSelector, DraftAutosave, ContinueBar | MVP |
02086: | S10 | Product wizard — category and contexts | /supplier/products/new/classification | SupplierShell, FormStepper, CategoryTreePicker, ApplicationContextSelector, ResolvedSchemaSummary, ContinueBar | MVP |
02087: | S11 | Product wizard — technical specifications | /supplier/products/new/specifications | SupplierShell, FormStepper, DynamicParameterForm, CompositionEditor, DimensionFields, ValidationSummary | MVP |
02088: | S12 | Product wizard — variants | /supplier/products/new/variants | SupplierShell, FormStepper, VariantAxisSelector, VariantMatrix, BulkEditControls, ContinueBar | Launch |
02089: | S13 | Product wizard — media and files | /supplier/products/new/media | SupplierShell, FormStepper, ImageUploader, ReorderableGallery, TechnicalFileUploader, MediaValidation | MVP |
02090: | S14 | Product wizard — commercial information | /supplier/products/new/commercial | SupplierShell, FormStepper, MOQFields, LeadTimeFields, CapacityFields, IncotermSelector, PackagingFields | MVP |
02091: | S15 | Product wizard — localization | /supplier/products/new/localization | SupplierShell, FormStepper, LocaleTabs, TranslationFields, FallbackPreview, ContinueBar | MVP |
02092: | S16 | Product preview and publish | /supplier/products/new/review | SupplierShell, FormStepper, PublicProductPreview, ValidationSummary, ClaimWarnings, PublishControls | MVP |
02093: | S17 | Product management detail | /supplier/products/:id | SupplierShell, ProductAdminHeader, StatusActions, ProductPreview, CompletionIssues, EvidencePanel, EditSectionLinks | MVP |
02094: | S18 | Matched RFQs list | /supplier/rfqs | SupplierShell, PageHeader, MatchFilters, MatchedRFQCards, MatchReasonChips, Pagination | MVP |
02095: | S19 | Matched RFQ detail | /supplier/rfqs/:id | SupplierShell, RFQHeader, MatchExplanation, LineItemTable, RequirementGroups, BuyerVisibilityNotice, RespondCTA | MVP |
02096: | S20 | RFQ response composer | /supplier/rfqs/:id/respond | SupplierShell, ResponseStepper, LineCoverageSelector, ResponseLineEditor, AlternativeSpecFields, AttachmentUploader, ReviewSubmitBar | MVP |
02097: | S21 | My responses | /supplier/responses | SupplierShell, PageHeader, StatusTabs, ResponseTable, FollowUpIndicators, Pagination | MVP |
02098: | S22 | Direct enquiries | /supplier/enquiries | SupplierShell, PageHeader, EnquiryList, ProductContextChip, BuyerIdentityState, OpenConversationAction | MVP |
02099: | S23 | Conversations list | /supplier/messages | SupplierShell, ConversationList, SearchBar, ContextFilters, UnreadBadge, EmptyState | MVP |
02100: | S24 | Conversation detail | /supplier/messages/:id | SupplierShell, ConversationHeader, ContextSummary, MessageThread, AttachmentList, ContactRevealPanel, MessageComposer | MVP |
02101: | S25 | Product evidence and claims | /supplier/evidence | SupplierShell, PageHeader, ClaimFilterBar, EvidenceStatusTable, UploadLinkActions, ExpiryWarnings | Launch |
02102: | S26 | Team management | /supplier/team | SupplierShell, PageHeader, TeamTable, InviteMemberModal, RoleSelector, RemoveMemberDialog | Launch |
02103: | S27 | Supplier settings | /supplier/settings | SupplierShell, SettingsTabs, ContactVisibilityForm, NotificationMatrix, ConsentControls, SaveBar | Launch |
02104: 
02105: 
02106: ### 37.5 Admin and moderator screens
02107: 
