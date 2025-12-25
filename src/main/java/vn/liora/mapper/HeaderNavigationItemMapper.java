package vn.liora.mapper;

import org.springframework.stereotype.Component;
import vn.liora.dto.request.HeaderNavigationItemRequest;
import vn.liora.entity.HeaderNavigationItem;
import vn.liora.entity.StaticPage;

import java.util.ArrayList;
import java.util.List;

@Component
public class HeaderNavigationItemMapper {

    public HeaderNavigationItem toEntity(HeaderNavigationItemRequest request) {
        if (request == null) {
            return null;
        }

        HeaderNavigationItem entity = new HeaderNavigationItem();
        entity.setId(request.getId());
        entity.setTitle(request.getTitle());
        entity.setUrl(request.getUrl());
        entity.setLinkType(request.getLinkType());
        entity.setItemOrder(request.getItemOrder());
        entity.setIsCategoryParent(request.getIsCategoryParent() != null ? request.getIsCategoryParent() : false);
        entity.setParentItemId(request.getParentItemId());
        entity.setIsActive(true);

        // Map lightweight references by id for service to resolve

        if (request.getStaticPageId() != null) {
            StaticPage pageRef = new StaticPage();
            pageRef.setId(request.getStaticPageId());
            entity.setStaticPage(pageRef);
        }

        // Map sub-items if they exist
        if (request.getSubItems() != null && !request.getSubItems().isEmpty()) {
            List<HeaderNavigationItem> subEntities = new ArrayList<>();
            for (HeaderNavigationItemRequest subRequest : request.getSubItems()) {
                HeaderNavigationItem subEntity = toEntity(subRequest);
                if (subEntity != null) {
                    subEntities.add(subEntity);
                }
            }
            entity.setSubItems(subEntities);
        }

        return entity;
    }

    public HeaderNavigationItemRequest toRequest(HeaderNavigationItem entity) {
        if (entity == null) {
            return null;
        }

        HeaderNavigationItemRequest request = new HeaderNavigationItemRequest();
        request.setId(entity.getId());
        request.setTitle(entity.getTitle());
        request.setUrl(entity.getUrl());
        request.setLinkType(entity.getLinkType());
        request.setItemOrder(entity.getItemOrder());
        request.setIsCategoryParent(entity.getIsCategoryParent());
        request.setParentItemId(entity.getParentItemId());

        return request;
    }

    public List<HeaderNavigationItem> toEntityList(List<HeaderNavigationItemRequest> requests) {
        if (requests == null) {
            return new ArrayList<>();
        }

        List<HeaderNavigationItem> entities = new ArrayList<>();
        for (HeaderNavigationItemRequest request : requests) {
            HeaderNavigationItem entity = toEntity(request);
            if (entity != null) {
                entities.add(entity);
            }
        }
        return entities;
    }

    public List<HeaderNavigationItemRequest> toRequestList(List<HeaderNavigationItem> entities) {
        if (entities == null) {
            return new ArrayList<>();
        }

        List<HeaderNavigationItemRequest> requests = new ArrayList<>();
        for (HeaderNavigationItem entity : entities) {
            HeaderNavigationItemRequest request = toRequest(entity);
            if (request != null) {
                requests.add(request);
            }
        }
        return requests;
    }
}
