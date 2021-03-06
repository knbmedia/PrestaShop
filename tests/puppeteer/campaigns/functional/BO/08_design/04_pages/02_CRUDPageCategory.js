require('module-alias/register');
// Using chai
const {expect} = require('chai');
const helper = require('@utils/helpers');
const loginCommon = require('@commonTests/loginBO');
const CategoryPageFaker = require('@data/faker/CMScategory');
const PageFaker = require('@data/faker/CMSpage');
// Importing pages
const BOBasePage = require('@pages/BO/BObasePage');
const LoginPage = require('@pages/BO/login/index');
const DashboardPage = require('@pages/BO/dashboard/index');
const PagesPage = require('@pages/BO/design/pages/index');
const AddPageCategoryPage = require('@pages/BO/design/pages/pageCategory/add');
const AddPagePage = require('@pages/BO/design/pages/add');
const FOBasePage = require('@pages/FO/FObasePage');
const SiteMapPage = require('@pages/FO/siteMap');
const CMSPage = require('@pages/FO/cms');
// Test context imports
const testContext = require('@utils/testContext');

const baseContext = 'functional_BO_design_pages_CRUDPageCategory';

let browser;
let page;
let numberOfCategories = 0;
let numberOfPages = 0;
let createCategoryData;
let editCategoryData;
let createPageData;
let editPageData;

// Init objects needed
const init = async function () {
  return {
    boBasePage: new BOBasePage(page),
    loginPage: new LoginPage(page),
    dashboardPage: new DashboardPage(page),
    pagesPage: new PagesPage(page),
    addPageCategoryPage: new AddPageCategoryPage(page),
    addPagePage: new AddPagePage(page),
    foBasePage: new FOBasePage(page),
    siteMapPage: new SiteMapPage(page),
    cmsPage: new CMSPage(page),
  };
};

// Create, Read, Update and Delete Page Category and Page
describe('Create, Read, Update and Delete Page Category and Page', async () => {
  // before and after functions
  before(async function () {
    browser = await helper.createBrowser();
    page = await helper.newTab(browser);
    this.pageObjects = await init();
    createCategoryData = await (new CategoryPageFaker());
    editCategoryData = await (new CategoryPageFaker({name: `update${createCategoryData.name}`}));
    createPageData = await (new PageFaker());
    editPageData = await (new PageFaker({
      displayed: false,
      title: `update${createPageData.title}`,
    }));
  });
  after(async () => {
    await helper.closeBrowser(browser);
  });
  // Login into BO
  loginCommon.loginBO();

  // Go to Design>Pages page
  it('should go to "Design>Pages" page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToCmsPagesPage', baseContext);
    await this.pageObjects.boBasePage.goToSubMenu(
      this.pageObjects.boBasePage.designParentLink,
      this.pageObjects.boBasePage.pagesLink,
    );
    await this.pageObjects.boBasePage.closeSfToolBar();
    const pageTitle = await this.pageObjects.pagesPage.getPageTitle();
    await expect(pageTitle).to.contains(this.pageObjects.pagesPage.pageTitle);
  });

  it('should reset all filters and get number of categories in BO', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'resetFilterFirst', baseContext);
    numberOfCategories = await this.pageObjects.pagesPage.resetAndGetNumberOfLines('cms_page_category');
    if (numberOfCategories !== 0) await expect(numberOfCategories).to.be.above(0);
  });

  // 1 : Create category then go to FO to check it
  describe('Create Page Category in BO and check it in FO', async () => {
    it('should go to add new page category', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToNewPageCategoryPage', baseContext);
      await this.pageObjects.pagesPage.goToAddNewPageCategory();
      const pageTitle = await this.pageObjects.addPageCategoryPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.addPageCategoryPage.pageTitleCreate);
    });

    it('should create page category ', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'CreatePageCategory', baseContext);
      const textResult = await this.pageObjects.addPageCategoryPage.createEditPageCategory(createCategoryData);
      await expect(textResult).to.equal(this.pageObjects.pagesPage.successfulCreationMessage);
    });

    it('should go back to categories', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goBackToCategoriesAfterCreation', baseContext);
      await this.pageObjects.pagesPage.backToList();
      const pageTitle = await this.pageObjects.pagesPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.pagesPage.pageTitle);
    });

    it('should check the categories number', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkCategoriesNumberAfterCreation', baseContext);
      const numberOfCategoriesAfterCreation = await this.pageObjects.pagesPage.getNumberOfElementInGrid(
        'cms_page_category',
      );
      await expect(numberOfCategoriesAfterCreation).to.be.equal(numberOfCategories + 1);
    });

    it('should search for the new category and check result', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'searchCreatedCategory1', baseContext);
      await this.pageObjects.pagesPage.filterTable(
        'cms_page_category',
        'input',
        'name',
        createCategoryData.name,
      );
      const textColumn = await this.pageObjects.pagesPage.getTextColumnFromTable(
        'cms_page_category',
        1,
        'name',
      );
      await expect(textColumn).to.contains(createCategoryData.name);
    });

    it('should go to FO and check the created category', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkCreatedCategoryFO', baseContext);
      const pageCategoryID = await this.pageObjects.pagesPage.getTextColumnFromTable(
        'cms_page_category',
        1,
        'id_cms_category',
      );
      page = await this.pageObjects.boBasePage.viewMyShop();
      this.pageObjects = await init();
      await this.pageObjects.foBasePage.changeLanguage('en');
      await this.pageObjects.foBasePage.clickAndWaitForNavigation(this.pageObjects.foBasePage.siteMapLink);
      const pageTitle = await this.pageObjects.siteMapPage.getPageTitle();
      await expect(pageTitle).to.equal(this.pageObjects.siteMapPage.pageTitle);
      const pageCategoryName = await this.pageObjects.siteMapPage.getPageCategoryName(pageCategoryID);
      await expect(pageCategoryName).to.contains(createCategoryData.name);
      page = await this.pageObjects.foBasePage.closePage(browser, 1);
      this.pageObjects = await init();
    });
  });
  // 2 : Create Page then go to FO to check it
  describe('Create Page in BO and preview it in FO', async () => {
    it('should click on view category', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'viewCategoryToCreateNewPage', baseContext);
      await this.pageObjects.pagesPage.viewCategory(1);
      const pageTitle = await this.pageObjects.pagesPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.pagesPage.pageTitle);
    });

    it('should get the pages number', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkNumberOfPages', baseContext);
      numberOfPages = await this.pageObjects.pagesPage.getNumberOfElementInGrid('cms_page');
      await expect(numberOfPages).to.equal(0);
    });

    it('should go to add new page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToAddNewPage', baseContext);
      await this.pageObjects.pagesPage.goToAddNewPage();
      const pageTitle = await this.pageObjects.addPageCategoryPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.addPageCategoryPage.pageTitleCreate);
    });

    it('should create page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'createPage', baseContext);
      const textResult = await this.pageObjects.addPagePage.createEditPage(createPageData);
      await expect(textResult).to.equal(this.pageObjects.pagesPage.successfulCreationMessage);
    });

    it('should search for the created page and check result', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkCreatedPage', baseContext);
      await this.pageObjects.pagesPage.filterTable(
        'cms_page',
        'input',
        'meta_title',
        createPageData.title,
      );
      const textColumn = await this.pageObjects.pagesPage.getTextColumnFromTable(
        'cms_page',
        1,
        'meta_title',
      );
      await expect(textColumn).to.contains(createPageData.title);
    });

    it('should go to edit page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToCreatedPageForPreview', baseContext);
      await this.pageObjects.pagesPage.goToEditPage(1);
      const pageTitle = await this.pageObjects.pagesPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.pagesPage.pageTitle);
    });

    it('should preview the page in FO', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'previewPage', baseContext);
      page = await this.pageObjects.addPagePage.previewPage();
      this.pageObjects = await init();
      const pageTitle = await this.pageObjects.cmsPage.getTextContent(this.pageObjects.cmsPage.pageTitle);
      await expect(pageTitle).to.contains(createPageData.title);
      const metaTitle = await this.pageObjects.cmsPage.getPageTitle();
      await expect(metaTitle).to.equal(createPageData.metaTitle);
      const pageContent = await this.pageObjects.cmsPage.getTextContent(this.pageObjects.cmsPage.pageContent);
      await expect(pageContent).to.include(createPageData.content);
      page = await this.pageObjects.cmsPage.closePage(browser, 1);
      this.pageObjects = await init();
    });

    it('should click on cancel button', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'cancelCreatedPageEdition', baseContext);
      await this.pageObjects.addPagePage.cancelPage();
      const pageTitle = await this.pageObjects.pagesPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.pagesPage.pageTitle);
    });
  });
  // 3 : Update category then go to FO to check it
  describe('Update Page Category created in BO and check it in FO', async () => {
    it('should search for the created category and check result', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'searchCreatedCategory2', baseContext);
      await this.pageObjects.pagesPage.filterTable(
        'cms_page_category',
        'input',
        'name',
        createCategoryData.name,
      );
      const textColumn = await this.pageObjects.pagesPage.getTextColumnFromTable(
        'cms_page_category',
        1,
        'name',
      );
      await expect(textColumn).to.contains(createCategoryData.name);
    });

    it('should go to edit category page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToEditCategory', baseContext);
      await this.pageObjects.pagesPage.goToEditCategoryPage(1);
      const pageTitle = await this.pageObjects.pagesPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.pagesPage.pageTitle);
    });

    it('should update the created page category', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'UpdateCategory', baseContext);
      const textResult = await this.pageObjects.addPageCategoryPage.createEditPageCategory(editCategoryData);
      await expect(textResult).to.equal(this.pageObjects.addPageCategoryPage.successfulUpdateMessage);
    });

    it('should go back to categories list', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goBackToCategoriesAfterUpdate', baseContext);
      await this.pageObjects.pagesPage.backToList();
      const pageTitle = await this.pageObjects.pagesPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.pagesPage.pageTitle);
    });

    it('should search for the updated category and check result', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'searchUpdatedCategory', baseContext);
      await this.pageObjects.pagesPage.filterTable(
        'cms_page_category',
        'input',
        'name',
        editCategoryData.name,
      );
      const textColumn = await this.pageObjects.pagesPage.getTextColumnFromTable(
        'cms_page_category',
        1,
        'name',
      );
      await expect(textColumn).to.contains(editCategoryData.name);
    });

    it('should go to FO and check the updated category', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkUpdatedCategoryFO', baseContext);
      const pageCategoryID = await this.pageObjects.pagesPage.getTextColumnFromTable(
        'cms_page_category',
        1,
        'id_cms_category',
      );
      page = await this.pageObjects.boBasePage.viewMyShop();
      this.pageObjects = await init();
      await this.pageObjects.foBasePage.changeLanguage('en');
      await this.pageObjects.foBasePage.clickAndWaitForNavigation(this.pageObjects.foBasePage.siteMapLink);
      const pageTitle = await this.pageObjects.siteMapPage.getPageTitle();
      await expect(pageTitle).to.equal(this.pageObjects.siteMapPage.pageTitle);
      const pageCategoryName = await this.pageObjects.siteMapPage.getPageCategoryName(pageCategoryID);
      await expect(pageCategoryName).to.contains(editCategoryData.name);
      page = await this.pageObjects.foBasePage.closePage(browser, 1);
      this.pageObjects = await init();
    });
  });
  // 4 : Update page then go to FO to check it
  describe('Update Page created in BO and preview it in FO', async () => {
    it('should click on view category', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'viewUpdatedCategory', baseContext);
      await this.pageObjects.pagesPage.viewCategory(1);
      const pageTitle = await this.pageObjects.pagesPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.pagesPage.pageTitle);
    });

    it('should search for the created page and check result', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'searchCreatedPage', baseContext);
      await this.pageObjects.pagesPage.filterTable(
        'cms_page',
        'input',
        'meta_title',
        createPageData.title,
      );
      const textColumn = await this.pageObjects.pagesPage.getTextColumnFromTable(
        'cms_page',
        1,
        'meta_title',
      );
      await expect(textColumn).to.contains(createPageData.title);
    });

    it('should go to edit page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToCreatedPageForUpdate', baseContext);
      await this.pageObjects.pagesPage.goToEditPage(1);
      const pageTitle = await this.pageObjects.pagesPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.pagesPage.pageTitle);
    });

    it('should update the created page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'updatePage', baseContext);
      const textResult = await this.pageObjects.addPagePage.createEditPage(editPageData);
      await expect(textResult).to.equal(this.pageObjects.pagesPage.successfulUpdateMessage);
    });

    it('should search for the updated Page and check result', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'searchUpdatedPageForPreview', baseContext);
      await this.pageObjects.pagesPage.filterTable(
        'cms_page',
        'input',
        'meta_title',
        editPageData.title,
      );
      const textColumn = await this.pageObjects.pagesPage.getTextColumnFromTable(
        'cms_page',
        1,
        'meta_title',
      );
      await expect(textColumn).to.contains(editPageData.title);
    });

    it('should go to edit page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToUpdatedPageForPreview', baseContext);
      await this.pageObjects.pagesPage.goToEditPage(1);
      const pageTitle = await this.pageObjects.pagesPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.pagesPage.pageTitle);
    });

    it('should click on preview button and check that the page does not exist in FO', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'previewUpdatedPage', baseContext);
      page = await this.pageObjects.addPagePage.previewPage();
      this.pageObjects = await init();
      const pageTitle = await this.pageObjects.cmsPage.getTextContent(this.pageObjects.cmsPage.pageTitle);
      await expect(pageTitle).to.include(this.pageObjects.cmsPage.pageNotFound);
      page = await this.pageObjects.foBasePage.closePage(browser, 1);
      this.pageObjects = await init();
    });

    it('should click on cancel button', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'cancelUpdatedPageEdition', baseContext);
      await this.pageObjects.addPagePage.cancelPage();
      const pageTitle = await this.pageObjects.pagesPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.pagesPage.pageTitle);
    });
  });
  // 5 : Delete Page and Category from BO
  describe('Delete Page and Category', async () => {
    it('should click on view category', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'viewCategoryForDelete', baseContext);
      await this.pageObjects.pagesPage.viewCategory(1);
      const pageTitle = await this.pageObjects.pagesPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.pagesPage.pageTitle);
    });

    it('should search for the updated page to delete', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'searchUpdatedPageForDelete', baseContext);
      await this.pageObjects.pagesPage.filterTable(
        'cms_page',
        'input',
        'meta_title',
        editPageData.title,
      );
      const textColumn = await this.pageObjects.pagesPage.getTextColumnFromTable(
        'cms_page',
        1,
        'meta_title',
      );
      await expect(textColumn).to.contains(editPageData.title);
    });

    it('should delete page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'deletePage', baseContext);
      const textResult = await this.pageObjects.pagesPage.deleteRowInTable('cms_page', 1);
      await expect(textResult).to.equal(this.pageObjects.pagesPage.successfulDeleteMessage);
    });

    it('should reset filter', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'resetFilterPages', baseContext);
      const numberOfPagesAfterDeletion = await this.pageObjects.pagesPage.resetAndGetNumberOfLines('cms_page');
      await expect(numberOfPagesAfterDeletion).to.be.equal(numberOfPages);
    });

    it('should click on back to list', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goBackToCategoriesAfterDelete', baseContext);
      await this.pageObjects.pagesPage.backToList();
      const pageTitle = await this.pageObjects.pagesPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.pagesPage.pageTitle);
    });

    it('should delete category', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'deleteCategory', baseContext);
      const textResult = await this.pageObjects.pagesPage.deleteRowInTable('cms_page_category', 1);
      await expect(textResult).to.equal(this.pageObjects.pagesPage.successfulDeleteMessage);
    });

    it('should reset filter', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'resetFilterCategories', baseContext);
      const numberOfCategoriesAfterDeletion = await this.pageObjects.pagesPage.resetAndGetNumberOfLines(
        'cms_page_category',
      );
      await expect(numberOfCategoriesAfterDeletion).to.be.equal(numberOfCategories);
    });
  });
});
